import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// === Metrics ===
// latency between sending "retrieve_resource" and getting a response
const latency = new Trend('socket_update_latency', true);
// how many websocket messages we receive in total
const received = new Counter('socket_messages_received');
// failed websocket connections or disconnects with error/unauthorized
const failed = new Counter('socket_failed_connections');
// if backend sends more messages than we expect (possible "extra updates" bug)
const extraUpdates = new Counter('socket_extra_updates');

// === Parameters via ENV ===
// how many virtual users (tabs-like clients) we simulate
const VUS = Number(__ENV.VUS || 100);
// how many "cycles" each VU performs in a single websocket session
const CYCLES_PER_SESSION = Number(__ENV.CYCLES_PER_SESSION || 10);
// how many "retrieve_resource" requests per cycle
const REQUESTS_PER_CYCLE = Number(__ENV.REQUESTS_PER_CYCLE || 10);
// total test duration
const TEST_DURATION = __ENV.TEST_DURATION || '5m';

// Channel and action for payouts
const CHANNEL = __ENV.CHANNEL || 'Admin::PayoutsChannel';
const ACTION = __ENV.ACTION || 'retrieve_resource';

// Payout IDs: comma-separated string, e.g. "1384,1383,1382"
const PAYOUT_IDS = (__ENV.PAYOUT_IDS || '1384,1383,1382,1381,1380,1379,1378,1377,1376,1375')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// If somehow there is no valid ID, use a fallback
if (!PAYOUT_IDS.length) {
  PAYOUT_IDS.push('1384,1383,1382,1381,1380,1379,1378,1377,1376,1375');
}

export const options = {
  vus: VUS,
  duration: TEST_DURATION,
  thresholds: {
    socket_failed_connections: ['count == 0'],
    socket_update_latency: ['p(95) < 1000'], // p95 < 1s
  },
};

const url = 'wss://crm-backend.fundingpips.dev/cable';
const COOKIE = __ENV.COOKIE;

if (!COOKIE) {
  throw new Error('Missing COOKIE environment variable for k6 test');
}

const CHANNEL_IDENTIFIER = JSON.stringify({ channel: CHANNEL });

// Helper: pick a random payout id from the list
function randomPayoutId() {
  const idx = Math.floor(Math.random() * PAYOUT_IDS.length);
  const raw = PAYOUT_IDS[idx];
  const asNumber = Number(raw);
  return Number.isNaN(asNumber) ? raw : asNumber;
}

export default function () {
  const headers = {
    Origin: 'https://admin.fundingpips.dev',
    'Sec-WebSocket-Protocol': 'actioncable-v1-json',
    Cookie: COOKIE,
  };

  const res = ws.connect(url, { headers }, function (socket) {
    let totalUpdatesReceived = 0;
    let lastSentAt = 0;
    let debugCount = 0;

    socket.on('open', () => {
      console.log(`✅ [VU${__VU}] connected to ${CHANNEL}`);

      // Subscribe to Admin::PayoutsChannel
      const subscribeMsg = {
        command: 'subscribe',
        identifier: CHANNEL_IDENTIFIER,
      };
      socket.send(JSON.stringify(subscribeMsg));

      // Wait a bit for "confirm_subscription" message
      socket.setTimeout(() => {
        runRequestCycles(socket);
      }, 1000);
    });

    // Each VU performs several "cycles":
    // in each cycle we send multiple "retrieve_resource" messages for random payout IDs
    function runRequestCycles(sock) {
      let cycle = 0;

      const doCycle = () => {
        if (cycle >= CYCLES_PER_SESSION) {
          // after all cycles we keep the connection a bit longer and then close
          sock.setTimeout(() => sock.close(), 3000);
          return;
        }

        cycle++;
        console.log(`🔁 [VU${__VU}] starting cycle ${cycle}/${CYCLES_PER_SESSION}`);

        let sent = 0;

        const sendRequest = () => {
          if (sent >= REQUESTS_PER_CYCLE) {
            // small pause between cycles
            sock.setTimeout(doCycle, 1000);
            return;
          }

          sent++;

          const payoutId = randomPayoutId();
          const payloadInner = {
            id: payoutId,
            action: ACTION,
            cycle,
            idx: sent,
            sent_at: Date.now(), // our own timestamp, in case backend sends it back
          };

          const wsMsg = {
            command: 'message',
            identifier: CHANNEL_IDENTIFIER,
            data: JSON.stringify(payloadInner),
          };

          lastSentAt = payloadInner.sent_at;
          socket.send(JSON.stringify(wsMsg));

          console.log(
            `📤 [VU${__VU}] retrieve_resource #${sent} in cycle ${cycle} (id=${payoutId})`,
          );

          // interval between "retrieve_resource" calls inside a cycle
          sock.setTimeout(sendRequest, 200);
        };

        // start first "retrieve_resource" in this cycle
        sendRequest();
      };

      // start first cycle
      doCycle();
    }

    socket.on('message', (raw) => {
      received.add(1);

      // log just first N messages for VU1 for debugging
      if (__VU === 1 && debugCount < 20) {
        console.log(`RAW[VU${__VU}] #${debugCount + 1}: ${raw}`);
        debugCount++;
      }

      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        console.log(`⚠️ [VU${__VU}] non-JSON message: ${raw}`);
        return;
      }

      // ActionCable control messages
      if (msg.type === 'ping' || msg.type === 'welcome' || msg.type === 'confirm_subscription') {
        return;
      }

      // Unauthorized / forced disconnect
      if (msg.type === 'disconnect') {
        console.log(
          `⛔ [VU${__VU}] disconnect: reason=${msg.reason}, reconnect=${msg.reconnect}`,
        );
        failed.add(1);
        return;
      }

      // If message is for a different channel, ignore it
      if (msg.identifier && msg.identifier !== CHANNEL_IDENTIFIER) {
        return;
      }

      // Business payload is usually in msg.message
      const inner = msg.message || msg;

      totalUpdatesReceived++;

      // If backend returns "sent_at", we can measure precise latency
      if (inner.sent_at) {
        const delay = Date.now() - inner.sent_at;
        latency.add(delay);
        console.log(`📩 [VU${__VU}] got response after ${delay}ms`);
      } else if (lastSentAt) {
        // Fallback: use lastSentAt if backend does not echo "sent_at"
        const delay = Date.now() - lastSentAt;
        latency.add(delay);
      }
    });

    socket.on('close', () => {
      console.log(`🔒 [VU${__VU}] closed, totalUpdatesReceived=${totalUpdatesReceived}`);

      // We expect at most one response per "retrieve_resource" request
      const expectedMaxPerSession = CYCLES_PER_SESSION * REQUESTS_PER_CYCLE;

      if (totalUpdatesReceived > expectedMaxPerSession) {
        extraUpdates.add(totalUpdatesReceived - expectedMaxPerSession);
      }
    });

    socket.on('error', (e) => {
      failed.add(1);
      console.error(`❌ [VU${__VU}] error: ${e.error()}`);
    });

    // Safety net: if something hangs, force close after 30s
    socket.setTimeout(() => {
      console.log(`⏰ [VU${__VU}] forced close by timeout`);
      socket.close();
    }, 30000);
  });

  check(res, { 'status is 101 (switching protocols)': (r) => r && r.status === 101 });
  sleep(1);
}
