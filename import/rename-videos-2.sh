#!/bin/bash
# Renames the exercise videos (batch 2) in the CURRENT Terminal folder.
#   Preview only (changes nothing):  bash ~/Downloads/rename-videos-2.sh
#   Actually rename:                 bash ~/Downloads/rename-videos-2.sh --go

GO=0; [ "$1" = "--go" ] && GO=1
LOG="$HOME/Desktop/rename-log-$(date +%Y%m%d-%H%M%S).txt"
found=0; done_n=0; missing=0; skipped=0; i=0

if [ ! -e "barbell clean.mp4" ] && [ ! -e "barbell-clean.mp4" ]; then
  echo "This doesn't look like the video folder."
  echo "Use cd to get into the folder first, then run this again."
  exit 1
fi

while IFS=$'\t' read -r old new; do
  [ -z "$old" ] && continue
  i=$((i+1))
  if [ ! -e "$old" ]; then missing=$((missing+1)); continue; fi
  found=$((found+1))
  if [ $GO -eq 0 ]; then printf '%s\n    -> %s\n' "$old" "$new"; continue; fi
  tmp=".renaming-tmp-$$-$i"
  if ! mv "$old" "$tmp"; then echo "FAILED: $old"; skipped=$((skipped+1)); continue; fi
  if [ -e "$new" ]; then
    mv "$tmp" "$old"; echo "SKIPPED (a file named $new already exists): $old"; skipped=$((skipped+1)); continue
  fi
  mv "$tmp" "$new" && { printf '%s\t%s\n' "$old" "$new" >> "$LOG"; done_n=$((done_n+1)); }
done << 'MAP'
barbell clean.mp4	barbell-clean.mp4
barbell hang clean.mp4	barbell-hang-clean.mp4
barbell hang squat clean.mp4	barbell-hang-squat-clean.mp4
bear plank (quadruped).mp4	bear-plank-quadruped.mp4
cable:band press with rotation.mp4	cable-band-press-w--rotation.mp4
cable:band rotation.mp4	cable-band-rotation.mp4
Captain morgan hold .mp4	captain-morgan-hold.mp4
continuous curls.mp4	continuous-curls.mp4
contralateral DB:KB staggered stance RDL.mp4	contralateral-db-kb-staggered-stance-rdl.mp4
Copenhagen tuck plank hip dips.mp4	copenhagen-tuck-plank-hip-dips.mp4
Copenhagen tuck plank.mp4	copenhagen-tuck-plank.mp4
cossak squat.mp4	cossack-squat.mp4
crossbody step up.mp4	crossbody-step-up.mp4
DB framers carry march.mp4	db-farmers-carry-march.mp4
DB reverse fly.mp4	db-reverse-fly.mp4
DB:KB farmers carry walk.mp4	db-kb-farmers-carry-walk.mp4
DB:KB goblet good morning.mp4	db-kb-goblet-good-morning.mp4
deadbug static hold.mp4	deadbug-static-hold.mp4
doorway stretch.mp4	doorway-stretch.mp4
Downward dog into bear plank.mp4	downward-dog-to-bear-plank.mp4
dual DB hand power clean.mp4	dual-db-hang-power-clean.mp4
dual DB hang squat clean.mp4	dual-db-hang-squat-clean.mp4
dual DB:KB sumo deadlift.mp4	dual-db-kb-sumo-deadlift.mp4
eccentric step ups.mp4	eccentric-step-ups.mp4
functional progressions.mp4	functional-progressions.mp4
glute bridge with pause.mp4	glute-bridge-w--pause.mp4
glute focused DB:KB reverse lunget.mp4	glute-focused-db-kb-reverse-lunge.mp4
glute focused split squat.mp4	glute-focused-split-squat.mp4
glute focused weighted bulgarian split squat.mp4	glute-focused-weighted-bulgarian-split-squat.mp4
half kneeling cable:band lat pulldown.mp4	half-kneeling-cable-band-lat-pulldown.mp4
half kneeling cable:band palloff press.mp4	half-kneeling-cable-band-pallof-press.mp4
half kneeling hip flexor stretch.mp4	half-kneeling-hip-flexor-stretch.mp4
half kneeling ipsilateral OH press.mp4	half-kneeling-ipsilateral-oh-press.mp4
half kneeling windmill.mp4	half-kneeling-windmill.mp4
Heels elevated hip thrust.mp4	heels-elevated-hip-thrust.mp4
hip 90:90.mp4	hip-90-90.mp4
hip flextion lift off hold.mp4	hip-flexion-lift-off-hold.mp4
incline DB skull crushers.mp4	incline-db-skull-crushers.mp4
incline push up into downward dog.mp4	incline-push-up-to-downward-dog.mp4
Kang squat.mp4	kang-squat.mp4
KB hip shifts.mp4	kb-hip-shifts.mp4
KB transfers.mp4	kb-transfers.mp4
Kneeling front squat.mp4	kneeling-front-squat.mp4
kneeling lat pulldown.mp4	kneeling-lat-pulldown.mp4
kneeling lunge to hamstring stretch.mp4	kneeling-lunge-to-hamstring-stretch.mp4
lat raise + extension rotation.mp4	lat-raise---extension-rotation.mp4
Lateral step up with slow eccentirc.mp4	lateral-step-up-w--slow-eccentric.mp4
legs only deadbug.mp4	legs-only-deadbug.mp4
low kneeling lat pulldown.mp4	low-kneeling-lat-pulldown.mp4
lying psoas march.mp4	lying-psoas-march.mp4
lying rear delt fly.mp4	lying-rear-delt-fly.mp4
med ball thruster toss.mp4	med-ball-thruster-toss.mp4
neutral DB floor press.mp4	neutral-db-floor-press.mp4
neutral DB shoulder press with slow eccentric .mp4	neutral-db-shoulder-press-w--slow-eccentric.mp4
offset march with KB:DB.mp4	offset-march-w--kb-db.mp4
pressing wall slide.mp4	pressing-wall-slide.mp4
pronated DB floor press.mp4	pronated-db-floor-press.mp4
psoas march.mp4	psoas-march.mp4
quad focused split squat.mp4	quad-focused-split-squat.mp4
quadruped opposite arm:leg raise.mp4	quadruped-opposite-arm-leg-raise.mp4
Quadruped shoulder CARs.mp4	quadruped-shoulder-cars.mp4
reverse clamshell.mp4	reverse-clamshell.mp4
Reverse DB fly with slow eccentric.mp4	reverse-db-fly-w--slow-eccentric.mp4
Scap push up.mp4	scap-push-up.mp4
Scapular CARs.mp4	scapular-cars.mp4
seated incline hammer curl with slow eccentric.mp4	seated-incline-hammer-curl-w--slow-eccentric.mp4
Shinbox flow.mp4	shinbox-flow.mp4
shinbox hip thrust.mp4	shinbox-hip-thrust.mp4
Shoulder wall slides.mp4	shoulder-wall-slides.mp4
Side lying adductor raise.mp4	side-lying-adductor-raise.mp4
side lying rotation.mp4	side-lying-rotation.mp4
single arm DB hang clean.mp4	single-arm-db-hang-clean.mp4
single arm DB:KB deadlift.mp4	single-arm-db-kb-deadlift.mp4
Single arm DB:KB upright row.mp4	single-arm-db-kb-upright-row.mp4
Single arm farmers march.mp4	single-arm-farmers-march.mp4
single arm tricep kickback.mp4	single-arm-tricep-kickback.mp4
single DB cossack squat.mp4	single-db-cossack-squat.mp4
single leg glute bridge .mp4	single-leg-glute-bridge.mp4
single leg hip thurst.mp4	single-leg-hip-thrust.mp4
singlr arm DB overhead walk.mp4	single-arm-db-overhead-walk.mp4
slow eccentric crossbody RDL with KB:DB.mp4	slow-eccentric-crossbody-rdl-w--kb-db.mp4
split squat static hold with adduction band.mp4	split-squat-static-hold-w--adduction-band.mp4
Split squat static hold.mp4	split-squat-static-hold.mp4
stability ball crunch.mp4	stability-ball-crunch.mp4
stability ball hamstring curl.mp4	stability-ball-hamstring-curl.mp4
staggered squat.mp4	staggered-squat.mp4
Staggered stance good morming .mp4	staggered-stance-good-morning.mp4
standing anti-rotation press.mp4	standing-anti-rotation-press.mp4
static hammer curl walk.mp4	static-hammer-curl-walk.mp4
sumo jefferson curl.mp4	sumo-jefferson-curl.mp4
supinated DB floor press.mp4	supinated-db-floor-press.mp4
supinated inverted row.mp4	supinated-inverted-row.mp4
T raise.mp4	t-raise.mp4
T-spine rotation on box.mp4	t-spine-rotation-on-box.mp4
T-spine rotation to elbow.mp4	t-spine-rotation-to-elbow.mp4
T-spine rotation.mp4	t-spine-rotation.mp4
tricep bench dips with knees bent.mp4	tricep-bench-dips-w--knees-bent.mp4
unweighted box squat.mp4	unweighted-box-squat.mp4
wall leaning psoas march.mp4	wall-leaning-psoas-march.mp4
wall press functional progression.mp4	wall-press-functional-progression.mp4
wall sit with front raise rotation.mp4	wall-sit-w--front-raise-rotation.mp4
weighted deadbug.mp4	weighted-deadbug.mp4
weighted functional progression.mp4	weighted-functional-progression.mp4
wide stance box back squat.mp4	wide-stance-box-back-squat.mp4
MAP

echo
if [ $GO -eq 0 ]; then
  echo "PREVIEW ONLY: $found files would be renamed. Nothing has been changed."
  [ $missing -gt 0 ] && echo "($missing names on the list weren't found here, likely already renamed.)"
  echo "To rename for real, run:  bash ~/Downloads/rename-videos-2.sh --go"
else
  echo "Done. Renamed $done_n files. Skipped: $skipped."
  echo "A record of every change was saved to your Desktop: $(basename "$LOG")"
fi
