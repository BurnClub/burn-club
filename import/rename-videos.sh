#!/bin/bash
# Renames the exercise videos in the CURRENT Terminal folder.
#   Preview only (changes nothing):  bash ~/Downloads/rename-videos.sh
#   Actually rename:                 bash ~/Downloads/rename-videos.sh --go

GO=0; [ "$1" = "--go" ] && GO=1
LOG="$HOME/Desktop/rename-log-$(date +%Y%m%d-%H%M%S).txt"
found=0; done_n=0; missing=0; skipped=0; i=0

# Safety check: make sure we're in the video folder
if [ ! -e "Air squat.m4v" ] && [ ! -e "air-squat.m4v" ]; then
  echo "This doesn't look like the video folder."
  echo "Use cd to get into the folder first, then run this again."
  exit 1
fi

while IFS=$'\t' read -r old new; do
  [ -z "$old" ] && continue
  i=$((i+1))
  if [ ! -e "$old" ]; then missing=$((missing+1)); continue; fi
  found=$((found+1))
  if [ $GO -eq 0 ]; then
    printf '%s\n    -> %s\n' "$old" "$new"
    continue
  fi
  # Rename in two steps so lowercase-only changes work on any drive
  tmp=".renaming-tmp-$$-$i"
  if ! mv "$old" "$tmp"; then echo "FAILED: $old"; skipped=$((skipped+1)); continue; fi
  if [ -e "$new" ]; then
    mv "$tmp" "$old"; echo "SKIPPED (a file named $new already exists): $old"; skipped=$((skipped+1)); continue
  fi
  mv "$tmp" "$new" && { printf '%s\t%s\n' "$old" "$new" >> "$LOG"; done_n=$((done_n+1)); }
done << 'MAP'
 Alternating DB snatch.mp4	alternating-db-snatch.mp4
1:4 front raise.mp4	1-4-front-raise.mp4
1:4 front to 1:4 lateral raise.mp4	1-4-front-to-1-4-lateral-raise.mp4
1:4 lateral raise.mp4	1-4-lateral-raise.mp4
2 way lateral raise.mp4	2-way-lateral-raise.mp4
21's with EZ bar.mp4	21s-with-ez-bar.mp4
3 second eccentric puch up.mp4	3-second-eccentric-push-up.mp4
3-Way Tricep Kickback .mp4	3-way-tricep-kickback.mp4
90 degree lateral raise.mp4	90-degree-lateral-raise.mp4
90 degree rotation to press.mp4	90-degree-rotation-to-press.mp4
90:90 hip switch.mp4	90-90-hip-switch.mp4
Adductor rocks.mp4	adductor-rocks.mp4
Air squat.m4v	air-squat.mp4
Alternating DB curl.m4v	alternating-db-curl.mp4
Alternating DB forward lunge.m4v	alternating-db-forward-lunge.mp4
Alternating barbell reverse lunge.m4v	alternating-barbell-reverse-lunge.mp4
Alternating pronated DB chest press.m4v	alternating-pronated-db-chest-press.mp4
Alternating single arm lat pulldown.m4v	alternating-single-arm-lat-pulldown.mp4
Alternating single leg raise: heel taps.m4v	alternating-single-leg-raise--heel-taps.mp4
Alternating standing toe taps.m4v	alternating-standing-toe-taps.mp4
American KB swing.mp4	american-kb-swing.mp4
Arnold Press.mp4	arnold-press.mp4
Banded row with 3 second eccentric.mp4	banded-row-with-3-second-eccentric.mp4
Barbell Z press.m4v	barbell-z-press.mp4
Barbell bench press.m4v	barbell-bench-press.mp4
Barbell box squat 2.m4v	barbell-box-squat-2.mp4
Barbell box squat.m4v	barbell-box-squat.mp4
Barbell shoulder press.m4v	barbell-shoulder-press.mp4
Bent over DB high row.mp4	bent-over-db-high-row.mp4
Box pistol squat.m4v	box-pistol-squat.mp4
Bulgarian split squat.mp4	bulgarian-split-squat.mp4
Cable upright row with rope.m4v	cable-upright-row-with-rope.mp4
Calf raise on leg press.m4v	calf-raise-on-leg-press.mp4
Copenhagen tuck plank hip dips.mp4	copenhagen-tuck-plank-hip-dips.mp4
Copenhagen tuck plank.mp4	copenhagen-tuck-plank.mp4
DB RDL into top loaded squat.mp4	db-rdl-to-top-loaded-squat.mp4
DB RDL with half rep.mp4	db-rdl-with-half-rep.mp4
DB RDL with neutral row.mp4	db-rdl-with-neutral-row.mp4
DB RDL.mp4	db-rdl.mp4
DB box step overs.m4v	db-box-step-overs.mp4
DB chest fly into narrow chest press.MP4	db-chest-fly-to-narrow-chest-press.mp4
DB chest fly into narrow chest press.m4v	db-chest-fly-to-narrow-chest-press-2.mp4
DB chest fly with supination.mp4	db-chest-fly-with-supination.mp4
DB chest fly.mp4	db-chest-fly.mp4
DB curtsey lunge into knee up.MP4	db-curtsey-lunge-to-knee-up.mp4
DB deficit split squat.m4v	db-deficit-split-squat.mp4
DB fire hydrants, hip extension, lateral band steps, .mp4	db-fire-hydrants-hip-extension-lateral-band-steps.mp4
DB front raise into press.m4v	db-front-raise-to-press.mp4
DB high row complex.m4v	db-high-row-complex.mp4
DB power jacks.m4v	db-power-jacks.mp4
DB pullover into press.m4v	db-pullover-to-press.mp4
DB pullover.mp4	db-pullover.mp4
DB reverse crunch.mp4	db-reverse-crunch.mp4
DB reverse fly.mp4	db-reverse-fly.mp4
DB skull crusher with reverse crunch.MP4	db-skull-crusher-with-reverse-crunch.mp4
DB skull crushers w: slow eccentric.m4v	db-skull-crushers-w--slow-eccentric.mp4
DB split squats.m4v	db-split-squats.mp4
DB squat to calf raise.MP4	db-squat-to-calf-raise.mp4
DB squat to calf raise.m4v	db-squat-to-calf-raise-2.mp4
DB squat with alternating calf raise.m4v	db-squat-with-alternating-calf-raise.mp4
DB squat with half rep.MP4	db-squat-with-half-rep.mp4
DB squat with jump squat.mp4	db-squat-with-jump-squat.mp4
DB thruster into top loaded forward lunge.mp4	db-thruster-to-top-loaded-forward-lunge.mp4
DB thrusters.mp4	db-thrusters.mp4
DB upright row with push out.mp4	db-upright-row-with-push-out.mp4
DB upright row.mp4	db-upright-row.mp4
DB walking lunge into squats.MP4	db-walking-lunge-to-squats.mp4
DB walking lunges.mp4	db-walking-lunges.mp4
Downward dog into bear plank.mp4	downward-dog-to-bear-plank.mp4
EZ bar cable tricep pushdown.m4v	ez-bar-cable-tricep-pushdown.mp4
Goblet squat.m4v	goblet-squat.mp4
Heels elevated hip thrust.mp4	heels-elevated-hip-thrust.mp4
Incline DB chest press.m4v	incline-db-chest-press.mp4
Incline Db chest fly into narrow press.m4v	incline-db-chest-fly-to-narrow-press.mp4
Incline barbell chest press.m4v	incline-barbell-chest-press.mp4
Incline bench push up.m4v	incline-bench-push-up.mp4
Incline narrow DB chest press.m4v	incline-narrow-db-chest-press.mp4
Incline single arm cable row.m4v	incline-single-arm-cable-row.mp4
Jefferson curls.mp4	jefferson-curls.mp4
KB RDL into squat.mp4	kb-rdl-to-squat.mp4
KB swing with squat.mp4	kb-swing-with-squat.mp4
KB swing.mp4	kb-swing.mp4
Kang squat.mp4	kang-squat.mp4
Kneeling front squat.mp4	kneeling-front-squat.mp4
Kneeling supinated cable row.m4v	kneeling-supinated-cable-row.mp4
Landmine RDL.m4v	landmine-rdl.mp4
Landmine squat.m4v	landmine-squat.mp4
Lateral raise complex.m4v	lateral-raise-complex.mp4
Lateral squat with plate pass.m4v	lateral-squat-with-plate-pass.mp4
Lateral step up.m4v	lateral-step-up.mp4
Leg press.m4v	leg-press.mp4
Machine chest press.m4v	machine-chest-press.mp4
Machine preacher curl.m4v	machine-preacher-curl.mp4
Military press complex.m4v	military-press-complex.mp4
Narrow DB squat.m4v	narrow-db-squat.mp4
Narrow air squat.m4v	narrow-air-squat.mp4
Narrow push up into spiderman crunch.m4v	narrow-push-up-to-spiderman-crunch.mp4
Neautral:close grip lat pulldown.m4v	neutral-close-grip-lat-pulldown.mp4
Neutral DB Chest Press w: 5 sec. eccentric.mp4	neutral-db-chest-press-w--5-sec-eccentric.mp4
Neutral DB row complex.m4v	neutral-db-row-complex.mp4
Neutral landmine row.m4v	neutral-landmine-row.mp4
Neutral to supinated incline DB chest press.m4v	neutral-to-supinated-incline-db-chest-press.mp4
Overhead Cable Tricep Extension with rope .mp4	overhead-cable-tricep-extension-with-rope.mp4
Overhead DB Tricep Extension .mp4	overhead-db-tricep-extension.mp4
Overhead DB walking lunge.m4v	overhead-db-walking-lunge.mp4
Pendlay:overhand barbell row.mp4	pendlay-overhand-barbell-row.mp4
Plate front raise with rotation.m4v	plate-front-raise-with-rotation.mp4
Pronated EZ bar curl.m4v	pronated-ez-bar-curl.mp4
Prone:lying hamstirng curl with toes pointed.mp4	prone-lying-hamstring-curl-with-toes-pointed.mp4
Prone:lying hamstring curl.mp4	prone-lying-hamstring-curl.mp4
Quadruped shoulder CARs.mp4	quadruped-shoulder-cars.mp4
Reverse DB deficit lunge.m4v	reverse-db-deficit-lunge.mp4
Reverse incline DB row.m4v	reverse-incline-db-row.mp4
Reverse lunge into kick.m4v	reverse-lunge-to-kick.mp4
Russian twists.mp4	russian-twists.mp4
Scap push up.mp4	scap-push-up.mp4
Scapular CARs.mp4	scapular-cars.mp4
Seated cable pulldown with rope.m4v	seated-cable-pulldown-with-rope.mp4
Seated cable row complex.m4v	seated-cable-row-complex.mp4
Seated single arm pulldown.m4v	seated-single-arm-pulldown.mp4
Seated single arm row.m4v	seated-single-arm-row.mp4
Side lying adductor raise.mp4	side-lying-adductor-raise.mp4
Singel arm neutral cable tricep extension.m4v	single-arm-neutral-cable-tricep-extension.mp4
Single arm DB row.m4v	single-arm-db-row.mp4
Single arm DB snatch.m4v	single-arm-db-snatch.mp4
Single arm DB:KB upright row.mp4	single-arm-db-kb-upright-row.mp4
Single arm Military press.m4v	single-arm-military-press.mp4
Single arm cable rear delt fly.m4v	single-arm-cable-rear-delt-fly.mp4
Single arm farmers march.mp4	single-arm-farmers-march.mp4
Single arm lat pulldown complex.m4v	single-arm-lat-pulldown-complex.mp4
Single arm neutral DB chest press.m4v	single-arm-neutral-db-chest-press.mp4
Single arm neutral DB shoulder press.m4v	single-arm-neutral-db-shoulder-press.mp4
Single arm preacher curl.m4v	single-arm-preacher-curl.mp4
Single leg DB reverse lunge.m4v	single-leg-db-reverse-lunge.mp4
Single leg V up into bicycle.m4v	single-leg-v-up-to-bicycle.mp4
Single leg press.m4v	single-leg-press.mp4
Smith machine incline chest press.m4v	smith-machine-incline-chest-press.mp4
Spider curl.m4v	spider-curl.mp4
Staggered stance good morming .mp4	staggered-stance-good-morning.mp4
Standing band row.m4v	standing-band-row.mp4
Standing pronated to neutral cable row.m4v	standing-pronated-to-neutral-cable-row.mp4
Static V hold with DB figure 8's.m4v	static-v-hold-with-db-figure-8s.mp4
Straight leg DB crunch.m4v	straight-leg-db-crunch.mp4
Sumo landmine RDL.m4v	sumo-landmine-rdl.mp4
Sumo landmine squat.m4v	sumo-landmine-squat.mp4
Supinated DB chest press complex.m4v	supinated-db-chest-press-complex.mp4
Supinated DB row complex.m4v	supinated-db-row-complex.mp4
T raise.mp4	t-raise.mp4
T:cross static hold.mp4	t-cross-static-hold.mp4
TRX and DB field goals.mp4	trx-and-db-field-goals.mp4
TRX high row.mp4	trx-high-row.mp4
TRX jump squat.mp4	trx-jump-squat.mp4
TRX neutral row row.mp4	trx-neutral-row.mp4
TRX single leg curtsey lunge.mp4	trx-single-leg-curtsey-lunge.mp4
TRX single leg reverse lunge.mp4	trx-single-leg-reverse-lunge.mp4
TRX squat.mp4	trx-squat.mp4
Tricep dips.m4v	tricep-dips.mp4
Wide leg press.m4v	wide-leg-press.mp4
YTA raise.mp4	yta-raise.mp4
Zottman curl.mp4	zottman-curl.mp4
adduction static hold.mp4	adduction-static-hold.mp4
alteranting reverse lunge with squat.mp4	alternating-reverse-lunge-with-squat-2.mp4
alternating DB skull crushers.MP4	alternating-db-skull-crushers.mp4
alternating crab toe taps.mp4	alternating-crab-toe-taps.mp4
alternating curtsey lunge.mp4	alternating-curtsey-lunge.mp4
alternating lateral raise.MP4	alternating-lateral-raise.mp4
alternating neutral DB fly.mp4	alternating-neutral-db-fly.mp4
alternating neutral DB front raise.mp4	alternating-neutral-db-front-raise.mp4
alternating reverse DB lunge.mp4	alternating-reverse-db-lunge.mp4
alternating reverse lunge into jump squat.MP4	alternating-reverse-lunge-to-jump-squat.mp4
alternating reverse lunge into jump squat.m4v	alternating-reverse-lunge-to-jump-squat-2.mp4
alternating reverse lunge with squat.mp4	alternating-reverse-lunge-with-squat.mp4
alternating side planks.mp4	alternating-side-planks.mp4
alternating single leg v-ups.mp4	alternating-single-leg-v-ups.mp4
alternating split stance DB row.mp4	alternating-split-stance-db-row.mp4
alternating supinated DB curl.mp4	alternating-supinated-db-curl.mp4
alternating supinated cross front raise.mp4	alternating-supinated-cross-front-raise.mp4
alternating wall leaning psoas march.mp4	alternating-wall-leaning-psoas-march.mp4
around the world into upright row.mp4	around-the-world-to-upright-row.mp4
around the world raise.mp4	around-the-world-raise.mp4
assisted  & bodyweight tricep dips.mp4	assisted-and-bodyweight-tricep-dips.mp4
assisted chin up static hold.mp4	assisted-chin-up-static-hold.mp4
assisted chin up.mp4	assisted-chin-up.mp4
assisted pull up static hold.mp4	assisted-pull-up-static-hold.mp4
assisted pull up with band.mp4	assisted-pull-up-with-band.mp4
assisted pull ups.mp4	assisted-pull-ups.mp4
ball slams.mp4	ball-slams.mp4
band pull aparts.mp4	band-pull-aparts.mp4
band row and curl.MP4	band-row-and-curl.mp4
banded clamshell.m4v	banded-clamshell.mp4
banded fire hydrants.m4v	banded-fire-hydrants.mp4
banded glute bridge static hold with abduction into glute bridge .m4v	banded-glute-bridge-static-hold-with-abduction-to-glute-bridge.mp4
banded glute bridge static hold with abduction.m4v	banded-glute-bridge-static-hold-with-abduction.mp4
banded glute bridge with abduction .MP4	banded-glute-bridge-with-abduction.mp4
banded glute bridge with abduction.m4v	banded-glute-bridge-with-abduction-2.mp4
banded lateral squat walk.MP4	banded-lateral-squat-walk.mp4
banded narrow to wide jump squat.m4v	banded-narrow-to-wide-jump-squat.mp4
banded plank with alternating leg raises.m4v	banded-plank-with-alternating-leg-raises.mp4
banded quadruped hip extension.m4v	banded-quadruped-hip-extension.mp4
banded row into RDL.m4v	banded-row-to-rdl.mp4
banded squat w: alternating side step.m4v	banded-squat-w--alternating-side-step.mp4
banded squat with alternating kickbacks.m4v	banded-squat-with-alternating-kickbacks.mp4
banded sumo squat with half rep.m4v	banded-sumo-squat-with-half-rep.mp4
barbell drag curl.m4v	barbell-drag-curl.mp4
barbell squat.mp4	barbell-squat.mp4
bear crawl shoulder taps w: narrow push up.m4v	bear-crawl-shoulder-taps-w--narrow-push-up.mp4
bear crawl shoulder taps.m4v	bear-crawl-shoulder-taps.mp4
bear crawl.mp4	bear-crawl.mp4
bear to plank.mp4	bear-to-plank.mp4
behind the back external rotation.mp4	behind-the-back-external-rotation.mp4
bench tricep dips.mp4	bench-tricep-dips.mp4
bent over DB fly complex.MP4	bent-over-db-fly-complex.mp4
bodyweight:banded good morning.mp4	bodyweight-banded-good-morning.mp4
bow:bench step ups.mp4	box-bench-step-ups.mp4
box squat.mp4	box-squat.mp4
burpee into tricep kickback.MP4	burpee-to-tricep-kickback.mp4
cable RDL into squat.mp4	cable-rdl-to-squat.mp4
cable RDL.mp4	cable-rdl.mp4
cable chest fly.mp4	cable-chest-fly.mp4
cable curl with rope.mp4	cable-curl-with-rope.mp4
cable curl with straight bar.mp4	cable-curl-with-straight-bar.mp4
cable glute kickback.mp4	cable-glute-kickback.mp4
cable pull through.mp4	cable-pull-through.mp4
cable pulse squat.mp4	cable-pulse-squat.mp4
cable squat walk.mp4	cable-squat-walk.mp4
cable sumo RDL with half rep.mp4	cable-sumo-rdl-with-half-rep.mp4
cable tricep extension with rope.mp4	cable-tricep-extension-with-rope.mp4
calf raises.m4v	calf-raises.mp4
chin up.mp4	chin-up.mp4
clamshell glute bridge.mp4	clamshell-glute-bridge.mp4
cross mountain climbers.mp4	cross-mountain-climbers.mp4
curtsey lunge.mp4	curtsey-lunge.mp4
deadbug DB chest press.mp4	deadbug-db-chest-press.mp4
deadbug DB skull crusher.mp4	deadbug-db-skull-crusher.mp4
decline cable chest fly.mp4	decline-cable-chest-fly.mp4
decline push up.m4v	decline-push-up.mp4
diamond plank jacks.mp4	diamond-plank-jacks.mp4
diamond plank.mp4	diamond-plank.mp4
downward dog into single leg crunch.mp4	downward-dog-to-single-leg-crunch.mp4
downward dog push up.mp4	downward-dog-push-up.mp4
eccentric step ups.mp4	eccentric-step-ups.mp4
explosive bench push ups.mp4	explosive-bench-push-ups.mp4
face pull with pause.mp4	face-pull-with-pause.mp4
face pull.mp4	face-pull.mp4
fire hydrant.m4v	fire-hydrant.mp4
front to lateral raise .mp4	front-to-lateral-raise.mp4
functional progressions.mp4	functional-progressions.mp4
glute bridge static hold w: DB skull crushers.m4v	glute-bridge-static-hold-w--db-skull-crushers.mp4
glute bridge static hold.m4v	glute-bridge-static-hold.mp4
goblet squat with heels elevated.mp4	goblet-squat-with-heels-elevated.mp4
good mornings.m4v	good-mornings.mp4
hack squat.mp4	hack-squat.mp4
half burpee into DB upright row.mp4	half-burpee-to-db-upright-row.mp4
half burpee with DB snatch.mp4	half-burpee-with-db-snatch.mp4
half kneeling windmill.mp4	half-kneeling-windmill.mp4
hammer curl static hold.mp4	hammer-curl-static-hold.mp4
hammer curl with supination at top.mp4	hammer-curl-with-supination-at-top.mp4
hamstring curl with sliders.mp4	hamstring-curl-with-sliders.mp4
hamstring runners.mp4	hamstring-runners.mp4
high plank.mp4	high-plank.mp4
high to low plank.mp4	high-to-low-plank.mp4
hollow hold.mp4	hollow-hold.mp4
horizontal TRX row.mp4	horizontal-trx-row.mp4
incline DB bench press (pronated grip).mp4	incline-db-bench-press-pronated-grip.mp4
incline DB chest fly.mp4	incline-db-chest-fly.mp4
incline cable chest fly.m4v	incline-cable-chest-fly-2.mp4
incline cable chest fly.mp4	incline-cable-chest-fly.mp4
jump split squat into squat.m4v	jump-split-squat-to-squat.mp4
jump split squat.mp4	jump-split-squat.mp4
jump squat.mp4	jump-squat.mp4
lat pull down with slow eccentric.mp4	lat-pull-down-with-slow-eccentric.mp4
lat pulldown.mp4	lat-pulldown.mp4
lateral DB squat.mp4	lateral-db-squat.mp4
lateral bear crawl.mp4	lateral-bear-crawl.mp4
lateral cable leg raise.mp4	lateral-cable-leg-raise.mp4
lateral plank walk.mp4	lateral-plank-walk.mp4
lateral raise.mp4	lateral-raise.mp4
lateral shuffle.mp4	lateral-shuffle.mp4
leg extension with toes pointed in.mp4	leg-extension-with-toes-pointed-in.mp4
leg extension with toes pointed out.mp4	leg-extension-with-toes-pointed-out.mp4
leg extension.mp4	leg-extension.mp4
leg press with 5 second static hold.mp4	leg-press-with-5-second-static-hold.mp4
lemon squeezers.mp4	lemon-squeezers.mp4
military press complex (single, single, both).mp4	military-press-complex-single-single-both.mp4
mountain climbers with sliders.mp4	mountain-climbers-with-sliders.mp4
mountain climbers.mp4	mountain-climbers.mp4
narrow DB RDL.mp4	narrow-db-rdl.mp4
narrow DB chest press with 10 second eccentric.mp4	narrow-db-chest-press-with-10-second-eccentric.mp4
narrow DB chest press.mp4	narrow-db-chest-press.mp4
narrow glute bridge.mp4	narrow-glute-bridge.mp4
narrow leg press.m4v	narrow-leg-press.mp4
narrow puch up.mp4	narrow-push-up.mp4
narrow smith machine squat.mp4	narrow-smith-machine-squat.mp4
narrow to wide jump squat.mp4	narrow-to-wide-jump-squat.mp4
narrow to wide supinated DB curl.mp4	narrow-to-wide-supinated-db-curl.mp4
neutral DB chest press complex.MP4	neutral-db-chest-press-complex.mp4
neutral DB chest press with supination at top.mp4	neutral-db-chest-press-with-supination-at-top.mp4
neutral DB chest press.mp4	neutral-db-chest-press.mp4
neutral DB front raise with pronated:overhand rotation at top .mp4	neutral-db-front-raise-with-pronated-overhand-rotation-at-top.mp4
neutral DB row into hammer curl.MP4	neutral-db-row-to-hammer-curl.mp4
neutral DB row into hammer curl.m4v	neutral-db-row-to-hammer-curl-2.mp4
neutral DB row.mp4	neutral-db-row.mp4
neutral DB shoulder press complex (single, single, both).mp4	neutral-db-shoulder-press-complex-single-single-both.mp4
neutral DB shoulder press.mp4	neutral-db-shoulder-press.mp4
neutral DB skull crushers.mp4	neutral-db-skull-crushers.mp4
neutral band row.m4v	neutral-band-row.mp4
neutral to pronated tricep kickback.mp4	neutral-to-pronated-tricep-kickback.mp4
neutral tricep kickbacks.MP4	neutral-tricep-kickbacks.mp4
neutral tricep kickbacks.m4v	neutral-tricep-kickbacks-2.mp4
neutral:hammer band curl.m4v	neutral-hammer-band-curl.mp4
neutral:normal glute bridge.mp4	neutral-normal-glute-bridge.mp4
peck deck fly static hold.mp4	pec-deck-fly-static-hold.mp4
peck deck fly.mp4	pec-deck-fly.mp4
plank with alternating shin:toe taps.mp4	plank-with-alternating-shin-toe-taps.mp4
plank with alternating tricep kickback.mp4	plank-with-alternating-tricep-kickback.mp4
plank with shoulder taps.mp4	plank-with-shoulder-taps.mp4
plank with side to side toe taps.mp4	plank-with-side-to-side-toe-taps.mp4
plank with spider man crunch .mp4	plank-with-spider-man-crunch-2.mp4
plank with spider man crunch.mp4	plank-with-spider-man-crunch.mp4
plate curl.mp4	plate-curl.mp4
pronated DB chest press.mp4	pronated-db-chest-press.mp4
pronated DB front raise.mp4	pronated-db-front-raise.mp4
pronated band curl.m4v	pronated-band-curl.mp4
pronated front raise with singles.mp4	pronated-front-raise-with-singles.mp4
pronated to supinated cable tricep extension.mp4	pronated-to-supinated-cable-tricep-extension.mp4
pull up.mp4	pull-up.mp4
pulse squat.mp4	pulse-squat.mp4
quadruped knee to elbow crunch.mp4	quadruped-knee-to-elbow-crunch.mp4
quadruped opposite arm:leg raise.mp4	quadruped-opposite-arm-leg-raise.mp4
quadruped up and overs.mp4	quadruped-up-and-overs.mp4
resistance band row with static hold.m4v	resistance-band-row-with-static-hold.mp4
resistance band squat.m4v	resistance-band-squat.mp4
resistance band thruster.m4v	resistance-band-thruster.mp4
reverse cable crossover fly.mp4	reverse-cable-crossover-fly.mp4
reverse crunch with plate pass.mp4	reverse-crunch-with-plate-pass.mp4
reverse lunge into knee up.MP4	reverse-lunge-to-knee-up.mp4
reverse lunge into knee up.m4v	reverse-lunge-to-knee-up-2.mp4
reverse peck deck fly.mp4	reverse-pec-deck-fly.mp4
reverse snow angles.mp4	reverse-snow-angels.mp4
scap pull-ups.m4v	scap-pull-ups.mp4
seated band abduction.m4v	seated-band-abduction.mp4
seated band abductions.MP4	seated-band-abductions.mp4
seated close grip row.m4v	seated-close-grip-row-2.mp4
seated close grip row.mp4	seated-close-grip-row.mp4
seated hamstring curl static hold.mp4	seated-hamstring-curl-static-hold.mp4
seated military press.mp4	seated-military-press.mp4
seated neutral band row.m4v	seated-neutral-band-row.mp4
seated pronated band row.m4v	seated-pronated-band-row.mp4
seated supinated band row.m4v	seated-supinated-band-row.mp4
side knee drives.m4v	side-knee-drives.mp4
side lying bicycle.m4v	side-lying-bicycle.mp4
side lying leg raise.m4v	side-lying-leg-raise.mp4
side lying reverse bicycle.m4v	side-lying-reverse-bicycle.mp4
side plank w: knee to elbow crunch.m4v	side-plank-w--knee-to-elbow-crunch.mp4
side plank with reach through.mp4	side-plank-with-reach-through.mp4
side plank with tricep extension.m4v	side-plank-with-tricep-extension.mp4
side to side ball slams.mp4	side-to-side-ball-slams.mp4
side to side lemon squeezers.mp4	side-to-side-lemon-squeezers.mp4
single DB squat.mp4	single-db-squat.mp4
single arm DB rear delt fly.m4v	single-arm-db-rear-delt-fly.mp4
single arm DB row on bench.mp4	single-arm-db-row-on-bench.mp4
single arm DB upright row with front raise.mp4	single-arm-db-upright-row-with-front-raise.mp4
single arm DB upright row.mp4	single-arm-db-upright-row.mp4
single arm arnold press.m4v	single-arm-arnold-press.mp4
single arm bent over cable tricp extension.m4v	single-arm-bent-over-cable-tricep-extension.mp4
single arm bent over fly.mp4	single-arm-bent-over-fly.mp4
single arm cable field goal (external rotation).mp4	single-arm-cable-field-goal-external-rotation.mp4
single arm cable high row.mp4	single-arm-cable-high-row.mp4
single arm hammer curl with static hold .mp4	single-arm-hammer-curl-with-static-hold.mp4
single arm lat pulldown.m4v	single-arm-lat-pulldown.mp4
single arm preacher curl on bench.mp4	single-arm-preacher-curl-on-bench.mp4
single arm pronated cable front raise.mp4	single-arm-pronated-cable-front-raise.mp4
single arm pronated tricep extension .mp4	single-arm-pronated-tricep-extension.mp4
single arm straight lat pulldown .mp4	single-arm-straight-lat-pulldown.mp4
single arm supinated DB curl with static hold.mp4	single-arm-supinated-db-curl-with-static-hold.mp4
single arm supinated tricep extension .mp4	single-arm-supinated-tricep-extension.mp4
single leg DB RDL.mp4	single-leg-db-rdl.mp4
single leg cable RDL .mp4	single-leg-cable-rdl.mp4
single leg glute bridge.mp4	single-leg-glute-bridge.mp4
single leg hip thrust.MP4	single-leg-hip-thrust.mp4
single leg hip thrust.m4v	single-leg-hip-thrust-2.mp4
single leg standing band abduction.m4v	single-leg-standing-band-abduction.mp4
slow eccentric crossbody RDL with KB:DB.mp4	slow-eccentric-crossbody-rdl-with-kb-db.mp4
smith machine alternating reverse lunge.mp4	smith-machine-alternating-reverse-lunge.mp4
smith machine reverse lunge with knee drive.mp4	smith-machine-reverse-lunge-with-knee-drive.mp4
smith machine split squat.mp4	smith-machine-split-squat.mp4
split squat complex.MP4	split-squat-complex.mp4
split squat with rotation.mp4	split-squat-with-rotation.mp4
split stance single arm band row.m4v	split-stance-single-arm-band-row.mp4
spring ig 2.m4v	spring-ig-2.mp4
squat jacks.mp4	squat-jacks.mp4
squat to calf raise.mp4	squat-to-calf-raise.mp4
squat with alternating knee to elbow crunch .mp4	squat-with-alternating-knee-to-elbow-crunch.mp4
squatting cable row.mp4	squatting-cable-row.mp4
staggered squat.mp4	staggered-squat.mp4
staggered stance DB RDL.MP4	staggered-stance-db-rdl.mp4
staggered stance DB RDL.m4v	staggered-stance-db-rdl-2.mp4
standing lat pulldown with rope.mp4	standing-lat-pulldown-with-rope.mp4
static V hold.mp4	static-v-hold.mp4
sumo DB half burpee.mp4	sumo-db-half-burpee.mp4
sumo DB squat static hold with calf raise.m4v	sumo-db-squat-static-hold-with-calf-raise.mp4
sumo DB squat to calf raise.m4v	sumo-db-squat-to-calf-raise.mp4
sumo DB squat.mp4	sumo-db-squat.mp4
sumo deadlift.mp4	sumo-deadlift.mp4
sumo squat static hold.mp4	sumo-squat-static-hold.mp4
supinated DB chest press with slow eccentric.mp4	supinated-db-chest-press-with-slow-eccentric.mp4
supinated DB chest press.mp4	supinated-db-chest-press.mp4
supinated DB curl.mp4	supinated-db-curl.mp4
supinated DB row into curl.m4v	supinated-db-row-to-curl.mp4
supinated DB row into supinated curl.MP4	supinated-db-row-to-supinated-curl.mp4
supinated DB row.MP4	supinated-db-row.mp4
supinated DB row.m4v	supinated-db-row-2.mp4
supinated DB shoulder press.mp4	supinated-db-shoulder-press.mp4
supinated band curl.m4v	supinated-band-curl.mp4
supinated grip cross body front raise.mp4	supinated-grip-cross-body-front-raise.mp4
supinated lat pulldown.mp4	supinated-lat-pulldown.mp4
supinated seated cable row.mp4	supinated-seated-cable-row.mp4
supinated shoulder press complex (single, single, both).mp4	supinated-shoulder-press-complex-single-single-both.mp4
supinated tricep kickback.mp4	supinated-tricep-kickback.mp4
supinated:underhand barbell row.mp4	supinated-underhand-barbell-row.mp4
supine mountain climbers.mp4	supine-mountain-climbers.mp4
supine plank.mp4	supine-plank.mp4
traditional deadlift.mp4	traditional-deadlift.mp4
turkish get up.mp4	turkish-get-up.mp4
up and overs.mp4	up-and-overs.mp4
walk out plank into mountain climbers.m4v	walk-out-plank-to-mountain-climbers.mp4
walk out plank.mp4	walk-out-plank.mp4
wall press functional progression.mp4	wall-press-functional-progression.mp4
weighted functional progression.mp4	weighted-functional-progression.mp4
wide glute bridge.mp4	wide-glute-bridge.mp4
wide grip lat pulldown.mp4	wide-grip-lat-pulldown.mp4
wide grip seated cable row.mp4	wide-grip-seated-cable-row.mp4
wide stance box back squat.mp4	wide-stance-box-back-squat.mp4
MAP

echo
if [ $GO -eq 0 ]; then
  echo "PREVIEW ONLY: $found files would be renamed. Nothing has been changed."
  [ $missing -gt 0 ] && echo "($missing names on the list weren't found here, likely already renamed.)"
  echo "To rename for real, run:  bash ~/Downloads/rename-videos.sh --go"
else
  echo "Done. Renamed $done_n files. Skipped: $skipped."
  echo "A record of every change was saved to your Desktop: $(basename "$LOG")"
fi
