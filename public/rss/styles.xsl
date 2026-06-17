<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title><xsl:value-of select="/rss/channel/title" /> &#8226; RSS Feed</title>
        <style>
          :root {
            --bg: #0a0e14;
            --bg-2: #0f1419;
            --accent: #ff5300;
            --text: #e6edf3;
            --text-2: #8b949e;
            --border: #21262d;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
          }
          .wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
          .banner {
            background: var(--bg-2);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 40px;
          }
          .banner p { margin: 0; color: var(--text-2); font-size: 0.95rem; }
          .banner strong { color: var(--text); }
          .url {
            display: inline-block;
            margin-top: 10px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.85rem;
            color: var(--accent);
            background: rgba(255, 83, 0, 0.08);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 6px 10px;
            word-break: break-all;
          }
          .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--accent);
            margin: 0 0 8px;
          }
          h1 { font-size: 2rem; margin: 0 0 8px; letter-spacing: -0.02em; }
          .desc { color: var(--text-2); margin: 0 0 40px; }
          .item {
            padding: 24px 0;
            border-top: 1px solid var(--border);
          }
          .item:last-child { border-bottom: 1px solid var(--border); }
          .item h2 { font-size: 1.25rem; margin: 0 0 8px; }
          .item a { color: var(--text); text-decoration: none; }
          .item a:hover { color: var(--accent); }
          .date { font-size: 0.8rem; color: var(--text-2); font-weight: 600; }
          .item p { color: var(--text-2); margin: 8px 0 0; }
          .item p mark { background: transparent; color: var(--accent); font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="banner">
            <p>
              <strong>This is an RSS feed.</strong> Subscribe by copying the URL below into your
              feed reader (Feedly, NetNewsWire, Inoreader, ...).
            </p>
            <span class="url"><xsl:value-of select="/rss/channel/link" />blog/rss.xml</span>
          </div>

          <p class="eyebrow">RSS Feed</p>
          <h1><xsl:value-of select="/rss/channel/title" /></h1>
          <p class="desc"><xsl:value-of select="/rss/channel/description" /></p>

          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <span class="date"><xsl:value-of select="pubDate" /></span>
              <h2>
                <a target="_blank">
                  <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                  <xsl:value-of select="title" />
                </a>
              </h2>
              <p><xsl:value-of select="description" disable-output-escaping="yes" /></p>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
