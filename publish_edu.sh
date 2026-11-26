#!/bin/bash
# Publishes the built web version of CYP EDU. Refuses when the built file is not the version of the sources,
# when the sources are not committed and pushed to cyp-edu-src, or when the last commit of the published app was not made from cyp-edu-src
# (another chat changed the app directly: port its changes into the sources first). Usage: publish_edu.sh "commit message"
# The commit carries the line "src: <commit of cyp-edu-src>". Set CLAUDE_SESSION_URL to add the session line.
set -e
V=$(grep -o "const VERSION = '[^']*'" /home/claude/alpha/app.js | head -1)
W=$(grep -o "const VERSION = '[^']*'" /home/claude/web/cyp-edu/index.html | head -1)
D=$(grep -o "const VERSION = '[^']*'" /home/claude/demo/cicetekelo-records-DEMO.html | head -1)
A=$(grep -o "const VERSION = '[^']*'" /home/claude/alpha/cicetekelo-records-alpha.html | head -1)
if [ "$V" != "$W" ] || [ "$V" != "$D" ] || [ "$V" != "$A" ]; then echo "STOP: versions differ. sources: $V | web: $W | demo: $D | file: $A"; exit 1; fi
if grep -q "cyp-edu-newtest\|test-new-version" /home/claude/web/cyp-edu/index.html /home/claude/web/cyp-edu/sw.js; then echo "STOP: test text in the built files"; exit 1; fi
cd /home/claude/cyp-edu && git pull -q origin main
LAST=$(git log -1 --format='%an | %s')
echo "last commit: $LAST"
if ! git log -1 --format='%B' | grep -q "^src: \|session_01GLTd4bKZNRP553mVb5T5P8"; then echo "STOP: the last commit of the app was not made from cyp-edu-src. Port its changes into the sources first."; exit 1; fi
SRC=/home/claude/cyp-edu-src
if [ -n "$(git -C $SRC status --porcelain)" ]; then echo "STOP: cyp-edu-src has changes not committed. Commit and push them first."; exit 1; fi
git -C $SRC fetch -q --depth=1 origin main 2>/dev/null || true
if [ "$(git -C $SRC rev-parse HEAD)" != "$(git -C $SRC rev-parse origin/main 2>/dev/null)" ]; then echo "STOP: cyp-edu-src is not pushed (or is behind origin/main)."; exit 1; fi
SRCH=$(git -C $SRC rev-parse --short HEAD)
cp ../web/cyp-edu/index.html ../web/cyp-edu/sw.js ../web/cyp-edu/manifest.webmanifest .
mkdir -p fonts licenses && cp ../web/cyp-edu/fonts/*.woff2 fonts/ && cp ../web/cyp-edu/licenses/* licenses/ && cp ../web/cyp-edu/bundle.css .
for f in fonts/Ubuntu-Medium.woff2 fonts/Ubuntu-Bold.woff2 fonts/OpenSans-Regular.woff2 fonts/OpenSans-SemiBold.woff2 fonts/OpenSans-Bold.woff2; do [ -s "$f" ] || { echo "STOP: $f missing"; exit 1; }; done
SESS=""; [ -n "$CLAUDE_SESSION_URL" ] && SESS="
Claude-Session: $CLAUDE_SESSION_URL"
git add -A && git commit -q -m "$1

src: $SRCH

Co-Authored-By: ${CLAUDE_COAUTHOR:-Claude <noreply@anthropic.com>}$SESS" && git push -q origin main && git log -1 --format='%h %s'
mkdir -p /mnt/user-data/outputs/cyp-edu
cp ../alpha/cicetekelo-records-alpha.html ../demo/cicetekelo-records-DEMO.html /mnt/user-data/outputs/ && cp index.html sw.js manifest.webmanifest /mnt/user-data/outputs/cyp-edu/ && cp -r fonts licenses bundle.css /mnt/user-data/outputs/cyp-edu/
echo "published $V"
