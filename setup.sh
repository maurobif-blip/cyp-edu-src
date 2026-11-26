#!/bin/bash
# Prepares a new session to work on CYP EDU from this repository. Run once, from anywhere: bash /home/claude/cyp-edu-src/setup.sh
set -e
R=/home/claude/cyp-edu-src
for d in alpha demo web server ds2; do
  if [ -e /home/claude/$d ] && [ ! -L /home/claude/$d ]; then echo "STOP: /home/claude/$d exists and is not a link to the repository"; exit 1; fi
  ln -sfn $R/$d /home/claude/$d
done
ln -sfn $R/publish_edu.sh /home/claude/publish_edu.sh
mkdir -p /tmp/cyp-shots
[ -s $R/local/pin.txt ] && echo "local/pin.txt: present" || echo "local/pin.txt: MISSING. The computer and demo files cannot be built. See CLAUDE.md."
[ -d /home/claude/cyp-edu/.git ] && echo "published app: /home/claude/cyp-edu present" || echo "published app: attach and clone maurobif-blip/cyp-edu to /home/claude/cyp-edu (see CLAUDE.md)"
node -e "require('playwright')" 2>/dev/null && echo "playwright: ok" || echo "playwright: missing"
echo "ready"
