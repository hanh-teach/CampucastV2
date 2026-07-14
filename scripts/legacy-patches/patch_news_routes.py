import re

with open("src/server/routes/news.routes.ts", "r") as f:
    content = f.read()

replacement = """  let xmlText = "";
  let fetchRes;
  let fetchSuccess = false;
  let lastFetchErr;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[RSS Debug] [BEFORE FETCH] Outbound fetch to url: ${url} at ${new Date().toISOString()} (Attempt ${attempt})`);
      fetchRes = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/xml, application/xml, application/rss+xml, application/atom+xml, text/html, */*",
          "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache"
        }
      });
      console.log(`[RSS Debug] [AFTER FETCH] Response status for ${url}: ${fetchRes.status} ${fetchRes.statusText}`);
      
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch feed: ${fetchRes.statusText} (${fetchRes.status})`);
      }
      
      xmlText = await fetchRes.text();
      fetchSuccess = true;
      break; // Success, exit loop
    } catch (err: any) {
      lastFetchErr = err;
      console.warn(`[RSS Debug] Attempt ${attempt} failed for ${url}: ${err.message}`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
      }
    }
  }

  clearTimeout(timeoutId);

  if (!fetchSuccess) {
    console.error(`[RSS Debug] [FETCH EXCEPTION] Fetch error or timeout for RSS feed ${url} after 3 attempts:`, lastFetchErr);"""

content = re.sub(
    r'  try \{\s*console\.log\(`\[RSS Debug\] \[BEFORE FETCH\] Outbound fetch to url: \$\{url\} at \$\{new Date\(\)\.toISOString\(\)\}`\);\s*const fetchRes = await fetch\(url, \{\s*signal: controller\.signal,\s*headers: \{\s*"User-Agent"[^\}]+\}\s*\}\);\s*console\.log\(`\[RSS Debug\] \[AFTER FETCH\] Response status for \$\{url\}: \$\{fetchRes\.status\} \$\{fetchRes\.statusText\}`\);\s*clearTimeout\(timeoutId\);\s*if \(\!fetchRes\.ok\) \{\s*throw new Error\(`Failed to fetch feed: \$\{fetchRes\.statusText\} \(\$\{fetchRes\.status\}\)`\);\s*\}\s*xmlText = await fetchRes\.text\(\);\s*\} catch \(fetchErr: any\) \{\s*clearTimeout\(timeoutId\);\s*console\.error\(`\[RSS Debug\] \[FETCH EXCEPTION\] Fetch error or timeout for RSS feed \$\{url\}:`, fetchErr\);',
    replacement,
    content
)

with open("src/server/routes/news.routes.ts", "w") as f:
    f.write(content)
