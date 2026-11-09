#!/usr/bin/env bash
# דמות גיבור חדשה מדף הדמות: bash tools/trellis/hero.sh <שם: tank|mage|assassin|warrior|hunter> <תיקיית עבודה>
# דורש: tools/trellis/in/<שם>-front.png, NODE_PATH עם החבילות של build3d.js, ו-python עם gradio_client, pygltflib, scipy, numpy, pillow.
# שלב TRELLIS צריך מכסת ZeroGPU: בלי טוקן של Hugging Face המכסה האנונימית מספיקה בערך לריצה אחת ליממה (נבדק 9.11.2026: הצייד עבר, ארבע הבאות נכשלו על "exceeded your ZeroGPU quota").
set -e; N=$1; W=$2; mkdir -p "$W"; HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."; KK=${KK:-C:/kk}
case $N in
  tank)     G=$KK/adv/addons/kaykit_character_pack_adventures/Characters/gltf/Barbarian.glb; RX='^Barbarian_(Arm|Body|Head|Leg)'; KEEP=Barbarian_;;
  mage)     G=$KK/adv2/Characters/gltf/Mage.glb;   RX='^Mage_(Arm|Body|Cape|Head|Leg)'; KEEP=Mage_;;
  assassin) G=$KK/adv/addons/kaykit_character_pack_adventures/Characters/gltf/Rogue_Hooded.glb; RX='^Rogue_(Arm|Body|Head|Leg)'; KEEP=Rogue_;;
  warrior)  G=$KK/adv2/Characters/gltf/Knight.glb; RX='^Knight_(Arm|Body|Cape|Head|Leg)'; KEEP=Knight_;;
  hunter)   G=$KK/adv2/Characters/gltf/Ranger.glb; RX='^Ranger_'; KEEP=Ranger_;;
esac
[ -f "$HERE/out/$N.glb" ] || (cd "$HERE" && python run.py "$N")          # TRELLIS (anonymous, or HF_TOKEN in the environment)
node "$HERE/decimate.js" "$HERE/out/$N.glb" "$W/$N-s.glb" 6000
node "$HERE/make-donor.js" "$W" "$G" "$RX" "donor_$N"
python "$HERE/reskin.py" "$W/donor_$N.glb" "$W/$N-s.glb" "$ROOT/art/heroes/${N^}HF.glb" 0 --match="$HERE/in/$N-front.png"
echo "next: add a CHARS row {src:art/heroes/${N^}HF.glb, keep:['$KEEP'], tex:512, fmt:'jpeg'} + LAZY in tools/models3d-io.js, then node tools/build3d.js C:/kk --only ${N}HF"
