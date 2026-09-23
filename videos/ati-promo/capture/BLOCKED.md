# Capture Failed

Capture failed: Failed to launch the browser process:  Code: 2147483651

stderr:
[0918/143643.816:ERROR:base\i18n\icu_util.cc:232] Invalid file descriptor to ICU data received.

TROUBLESHOOTING: https://pptr.dev/troubleshooting


URL: https://advancedlogiclabs.dpdns.org

## What to try

- Re-run with a longer timeout: `--timeout 60000`
- The site may block headless browsers (anti-bot protection)
- Try capturing a different page on the same domain
