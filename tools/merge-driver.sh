#!/bin/bash
# מנהל מיזוגים: ממזג את ה-PR הראשון ברשימה שפתוח, בלי התנגשויות, וכל הבדיקות שלו ירוקות, ושה-PR שהוא תלוי בו כבר מוזג.
# אחרי מיזוג אחד הוא יוצא, כדי שהסשן המתאם יעיר את מי שצריך להתעדכן מ-main. אם אין מה למזג, יוצא אחרי כ-45 דקות עם דוח.
# שימוש:  bash tools/merge-driver.sh "15:0 23:15 27:23"   (מספר PR:ה-PR שהוא תלוי בו, 0 = בלי תלות)
# מריצים ברקע. מיזוג בלי אישור מותר רק במחשב עם FH_SELF_MERGE=1 (CLAUDE.md, כלל 9).
cd "$(dirname "$0")/.."
ORDER="$1"
for round in $(seq 1 45); do
  for pair in $ORDER; do
    n=${pair%%:*}; dep=${pair##*:}
    if [ "$dep" != 0 ] && [ "$(gh pr view $dep --json state --jq .state)" != MERGED ]; then continue; fi
    read state mergeable checks <<<"$(gh pr view $n --json state,mergeable,statusCheckRollup --jq '"\(.state) \(.mergeable) \([.statusCheckRollup[]? | (.conclusion // .status // "PENDING")] | if length==0 then "NONE" elif all(.=="SUCCESS" or .=="SKIPPED" or .=="NEUTRAL") then "GREEN" elif any(.=="FAILURE" or .=="CANCELLED" or .=="TIMED_OUT") then "RED" else "PENDING" end)"')"
    [ "$state" = OPEN ] || continue
    if [ "$mergeable" = MERGEABLE ] && [ "$checks" = GREEN ]; then
      title=$(gh pr view $n --json title --jq .title)
      gh pr merge $n --squash --subject "$title (#$n)" --body "מה נעשה: $title. הפרטים ב-PR #$n.
למה: לפי התוכנית ב-roadmap.md.
מי אישר: Claude, לפי בקשת ניר, אחרי שהבדיקות ב-GitHub עברו." && { echo "MERGED #$n"; exit 0; }
    fi
  done
  sleep 60
done
for pair in $ORDER; do n=${pair%%:*}; gh pr view $n --json number,state,mergeable --jq '"#\(.number) \(.state) \(.mergeable)"'; done
