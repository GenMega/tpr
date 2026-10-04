export default {
  async fetch(request: Request, env: Record<string, string>, ctx: ExecutionContext): Promise<Response> {
    const loginUrl = "https://ptcad.top/login.php";
    const earnUrl = "https://ptcad.top/earn.php";

    const commonHeaders = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/154.0.8037.55 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Connection": "keep-alive"
    };

    const cookies: Record<string, string> = {};

    function extractCookies(response: Response) {
      // Deno fully supports getSetCookie() natively
      const setCookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];

      for (const cookieStr of setCookies) {
        const mainPart = cookieStr.split(';')[0];
        const parts = mainPart.split('=');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const value = parts.slice(1).join('=').trim();

          if (value === "deleted" || cookieStr.toLowerCase().includes("max-age=0")) {
            delete cookies[name];
          } else {
            cookies[name] = value;
          }
        }
      }
    }

    function getCookieHeader() {
      return Object.entries(cookies)
        .map(([name, val]) => `${name}=${val}`)
        .join("; ");
    }

    function generate14DigitRandom() {
      return Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
    }

    // ================================
    // REQUEST 1: GET LOGIN
    // ================================
    let response1 = await fetch(loginUrl, {
      method: "GET",
      headers: { ...commonHeaders, "Sec-Fetch-Site": "none" },
      redirect: "manual"
    });
    extractCookies(response1);

    // ================================
    // REQUEST 2: POST LOGIN
    // ================================
    const postData = 
      "email=pindcine%40gmail.com" +
      "&password=makeacar" +
      "&fp_language=en-IN" +
      "&fp_languages=en-IN" +
      "&fp_timezone=Asia%2FCalcutta" +
      "&fp_timezone_offset=-330" +
      "&fp_screen_width=390" +
      "&fp_screen_height=844" +
      "&fp_avail_width=390" +
      "&fp_avail_height=844" +
      "&fp_color_depth=24" +
      "&fp_pixel_ratio=3" +
      "&fp_platform=iPhone" +
      "&fp_hardware_concurrency=4" +
      "&fp_device_memory=0" +
      "&fp_max_touch_points=5" +
      "&fp_webgl_vendor=Apple+Inc." +
      "&fp_webgl_renderer=Apple+GPU" +
      "&fp_canvas_hash=eb8f39e6" +
      "&fp_webgl_hash=db8484d5" +
      "&fp_cookie_enabled=1" +
      "&fp_do_not_track=" +
      "&fp_window_width=390" +
      "&fp_window_height=669";

    let response2 = await fetch(loginUrl, {
      method: "POST",
      headers: {
        ...commonHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://ptcad.top",
        "Referer": "https://ptcad.top/login.php",
        "Sec-Fetch-Site": "same-origin",
        "Cookie": getCookieHeader()
      },
      body: postData,
      redirect: "manual"
    });
    extractCookies(response2);

    // ================================
    // REQUEST 3: GET EARN.PHP (Extract Token)
    // ================================
    let response3 = await fetch(earnUrl, {
      method: "GET",
      headers: {
        ...commonHeaders,
        "Referer": "https://ptcad.top/dashboard.php",
        "Sec-Fetch-Site": "same-origin",
        "Cookie": getCookieHeader()
      },
      redirect: "manual"
    });
    extractCookies(response3);
    const earnHtml = await response3.text();

    let token = "";
    const tokenMatch = earnHtml.match(/var\s+token\s*=\s*"([a-fA-F0-9]+)"/);
    if (tokenMatch && tokenMatch[1]) {
      token = tokenMatch[1];
    } else {
      return new Response("Error: Could not extract security token.", { status: 500 });
    }

    // ================================
    // REQUEST 4: DOCLICK INTERSTITIAL GET & POST
    // ================================
    const doclickGetUrl = `https://redirect-adult.redirect-doclick.top/serve/dl.php?user=8&type=1&ptc_token=${token}`;
    const doclickHeaders = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
      "Connection": "keep-alive",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "upgrade-insecure-requests": "1",
      "x-requested-with": "mark.via.gp",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "iframe",
      "sec-fetch-storage-access": "active",
      "sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Android WebView\";v=\"151\", \"Chromium\";v=\"151\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "accept-language": "en-IN,en-US;q=0.9,en;q=0.8",
      "priority": "u=0, i"
    };

    let doclickGetResponse = await fetch(doclickGetUrl, {
      method: "GET",
      headers: doclickHeaders
    });
    const doclickHtml = await doclickGetResponse.text();

    let dlValidActionUrl = "";
    let dlValidToken = "";

    const actionMatch = doclickHtml.match(/<form\s+action="([^"]+)"/i);
    if (actionMatch && actionMatch[1]) {
      dlValidActionUrl = actionMatch[1];
    }

    const inputTokenMatch = doclickHtml.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i);
    if (inputTokenMatch && inputTokenMatch[1]) {
      dlValidToken = inputTokenMatch[1];
    }

    let dlValidResponseText = "Form action or token not found";
    let dlValidStatusHttp = 0;

    if (dlValidActionUrl && dlValidToken) {
      const dlValidRes = await fetch(dlValidActionUrl, {
        method: "POST",
        headers: {
          ...doclickHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
          "Origin": "https://redirect-adult.redirect-doclick.top",
          "Referer": doclickGetUrl,
          "sec-fetch-site": "same-origin",
          "sec-fetch-dest": "document"
        },
        body: `token=${encodeURIComponent(dlValidToken)}`
      });
      dlValidStatusHttp = dlValidRes.status;
      dlValidResponseText = await dlValidRes.text();
    }

    // ================================
    // REQUEST 5: START POPUP EVENT
    // ================================
    const rStart = generate14DigitRandom();
    const startUrl = `https://ptcad.top/popup-event.php?token=${token}&action=start&source=ANCHOR.CLICK&r=${rStart}`;

    let startResponse = await fetch(startUrl, {
      method: "GET",
      headers: {
        ...commonHeaders,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": earnUrl,
        "Sec-Fetch-Site": "same-origin",
        "Cookie": getCookieHeader()
      }
    });

    const startBodyText = await startResponse.text();
    let eventId = null;
    try {
      const startJson = JSON.parse(startBodyText);
      eventId = startJson.event_id;
    } catch (e) {}

    // ================================
    // REQUEST 6: STATUS CHECK (Every 3 sec until completion)
    // ================================
    const statusResponses = [];
    let maxAttempts = 15;

    for (let i = 1; i <= maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const rStatus = generate14DigitRandom();
      const statusUrl = `https://ptcad.top/popup-event.php?action=status&token=${token}&r=${rStatus}`;

      const statusRes = await fetch(statusUrl, {
        method: "GET",
        headers: {
          ...commonHeaders,
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": earnUrl,
          "Sec-Fetch-Site": "same-origin",
          "Cookie": getCookieHeader()
        }
      });

      const statusText = await statusRes.text();
      let statusJson: any = {};
      try {
        statusJson = JSON.parse(statusText);
      } catch (e) {}

      statusResponses.push({
        attempt: i,
        statusHttp: statusRes.status,
        response: statusText
      });

      if (statusJson.elapsed_ms && statusJson.required_seconds) {
        if (statusJson.elapsed_ms >= (statusJson.required_seconds * 1000)) {
          break;
        }
      }
    }

    // ================================
    // REQUEST 7: COMPLETE EVENT
    // ================================
    let completeResponseText = "Not executed";
    let completeStatusHttp = 0;

    if (eventId) {
      const rComplete = generate14DigitRandom();
      const completeUrl = `https://ptcad.top/popup-event.php?token=${token}&action=complete&event_id=${eventId}&source=ANCHOR.CLICK&r=${rComplete}`;

      const completeRes = await fetch(completeUrl, {
        method: "GET",
        headers: {
          ...commonHeaders,
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Referer": earnUrl,
          "Sec-Fetch-Site": "same-origin",
          "Cookie": getCookieHeader()
        }
      });

      completeStatusHttp = completeRes.status;
      completeResponseText = await completeRes.text();
    }

    // ================================
    // HTML OUTPUT DISPLAY
    // ================================
    const htmlOutput = `
      <h2>Full Workflow Complete (Deno Deploy)</h2>
      <h3>Extracted Token</h3>
      <pre>${escapeHtml(token)}</pre>
      <h3>Doclick Validation POST Response (HTTP ${dlValidStatusHttp})</h3>
      <pre style="background: #f9f9f9; padding: 10px;">${escapeHtml(dlValidResponseText)}</pre>
      <h3>Popup Event Start Response</h3>
      <pre>${escapeHtml(startBodyText)}</pre>
      <h3>Saved Event ID</h3>
      <pre style="color: green; font-weight: bold;">${escapeHtml(String(eventId))}</pre>
      <h3>Status Polling Responses (Every 3s)</h3>
      <pre>${escapeHtml(JSON.stringify(statusResponses, null, 2))}</pre>
      <h3>Final Complete Response (HTTP ${completeStatusHttp})</h3>
      <pre style="background: #eef; padding: 10px; font-weight: bold; color: #008000;">${escapeHtml(completeResponseText)}</pre>
    `;

    return new Response(htmlOutput, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
