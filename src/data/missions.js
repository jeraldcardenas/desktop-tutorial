/**
 * Local mission database for TalkQuest.
 *
 * Each mission follows the shape:
 *   {
 *     id: string,
 *     ageGroup: '1-2' | '2-3' | '3-4',
 *     theme: 'jungle' | 'ocean' | 'space' | 'animals' | 'colors',
 *     category: 'language' | 'motor' | 'social' | 'cognitive' | 'emotion' | 'pretend',
 *     mode: 'treasure' | 'copy' | 'animal' | 'emotion' | 'story',
 *     prompt: string,         // spoken + shown to the child (kept short)
 *     parentTip: string,      // small coaching tip for the grown-up
 *     celebration: string,    // shown on the celebration screen
 *     options?: string[],     // Story Builder choices only
 *   }
 *
 * Missions are intentionally plain data so they can later be swapped for or
 * augmented by AI-generated missions without touching the UI. See
 * services/missionService.js for selection/randomization logic.
 */

// Helper keeps the long list below readable and guarantees a consistent shape.
let _seq = 0;
const m = (ageGroup, theme, category, mode, prompt, parentTip, celebration, options) => ({
  id: `m${String(++_seq).padStart(3, '0')}`,
  ageGroup,
  theme,
  category,
  mode,
  prompt,
  parentTip,
  celebration,
  ...(options ? { options } : {}),
});

const missions = [
  // ───────────────────────────── 1–2 YEARS ─────────────────────────────
  // Very simple one-step tasks: pointing, clapping, body parts, common objects.

  // Treasure Hunt
  m('1-2', 'colors', 'language', 'treasure', 'Can you find something BLUE?',
    'Point to it together and say "blue!" slowly.', 'Great looking, Explorer!'),
  m('1-2', 'colors', 'language', 'treasure', 'Find something RED!',
    'Name the object out loud: "Red ball!"', 'You found it! Hooray!'),
  m('1-2', 'jungle', 'cognitive', 'treasure', 'Find something SOFT.',
    'Let your child touch it and feel how soft it is.', 'So soft! Well done!'),
  m('1-2', 'jungle', 'language', 'treasure', 'Find a BALL!',
    'Roll it back and forth and say "ball".', 'You found the ball!'),
  m('1-2', 'animals', 'social', 'treasure', 'Show Mommy or Daddy your SHOE.',
    'Cheer when they point to it.', 'Nice sharing!'),
  m('1-2', 'ocean', 'cognitive', 'treasure', 'Find something BIG.',
    'Stretch your arms wide and say "big!"', 'So big! Amazing!'),
  m('1-2', 'space', 'language', 'treasure', 'Find a CUP!',
    'Pretend to drink and say "yum".', 'You found the cup!'),
  m('1-2', 'colors', 'cognitive', 'treasure', 'Find something YELLOW like the sun.',
    'Point up and say "sunny yellow!"', 'Sunny job!'),

  // Copy Me
  m('1-2', 'animals', 'motor', 'copy', 'Clap your hands!',
    'Clap together and smile big.', 'Clap clap! Yay!'),
  m('1-2', 'animals', 'motor', 'copy', 'Touch your NOSE.',
    'Touch your own nose first so they can copy.', 'You found your nose!'),
  m('1-2', 'jungle', 'social', 'copy', 'Wave hello!',
    'Wave back and say "hi!"', 'Hello, friend!'),
  m('1-2', 'space', 'motor', 'copy', 'Touch your HEAD.',
    'Pat your head together gently.', 'Great touching!'),
  m('1-2', 'ocean', 'motor', 'copy', 'Stomp your feet!',
    'Stomp along and count the stomps.', 'Stompy stomp! Yay!'),
  m('1-2', 'colors', 'social', 'copy', 'Blow a kiss!',
    'Blow one back to your little one.', 'Mwah! So sweet!'),

  // Animal Adventure
  m('1-2', 'animals', 'language', 'animal', 'Make a doggy sound: woof woof!',
    'Say "woof" and wait for them to try.', 'Woof woof! Good doggy!'),
  m('1-2', 'animals', 'language', 'animal', 'Make a kitty sound: meow!',
    'Meow softly and let them copy.', 'Meow! Cute kitty!'),
  m('1-2', 'animals', 'language', 'animal', 'Make a cow sound: moooo!',
    'Drag out the "moo" nice and long.', 'Mooo! Well done!'),
  m('1-2', 'jungle', 'language', 'animal', 'Roar like a lion: rawr!',
    'Make a soft roar so it stays fun, not scary.', 'Rawr! Brave lion!'),
  m('1-2', 'animals', 'motor', 'animal', 'Flap your arms like a bird!',
    'Flap together around the room.', 'Flap flap! You can fly!'),

  // Emotion Play
  m('1-2', 'animals', 'emotion', 'emotion', 'Show me a BIG smile!',
    'Smile back so they can copy your face.', 'What a happy smile!'),
  m('1-2', 'colors', 'emotion', 'emotion', 'Give a happy giggle!',
    'Tickle gently or be silly to spark a laugh.', 'Such a happy giggle!'),

  // ───────────────────────────── 2–3 YEARS ─────────────────────────────
  // Colors, counting 1–3, animal movement, object naming, pretend, "show me".

  // Treasure Hunt
  m('2-3', 'colors', 'language', 'treasure', 'Find something GREEN and tell me what it is.',
    'Ask: "What is it? What color?"', 'Green explorer, well done!'),
  m('2-3', 'colors', 'cognitive', 'treasure', 'Find something ROUND.',
    'Trace the round shape with your finger.', 'Round and round! Yay!'),
  m('2-3', 'jungle', 'cognitive', 'treasure', 'Bring something that makes a SOUND.',
    'Shake it together and listen.', 'Shaky shaky! Great find!'),
  m('2-3', 'ocean', 'language', 'treasure', 'Find something WET... or pretend something is wet!',
    'Talk about wet and dry together.', 'Splashy great job!'),
  m('2-3', 'animals', 'cognitive', 'treasure', 'Find TWO of the same thing.',
    'Count them: "one, two!"', 'Two! You counted!'),
  m('2-3', 'space', 'language', 'treasure', 'Find something that is YOURS.',
    'Ask "Whose is it?" and name it.', 'That is yours! Nice!'),
  m('2-3', 'colors', 'cognitive', 'treasure', 'Find something SMALL.',
    'Pinch fingers and say "tiny!"', 'So small! Good eyes!'),
  m('2-3', 'jungle', 'language', 'treasure', 'Find a LEAF or something green like a plant.',
    'Name it and describe its color.', 'A leaf! Jungle pro!'),
  m('2-3', 'animals', 'language', 'treasure', 'Find your favorite TOY and tell me its name.',
    'Ask them to say the toy\'s name.', 'Great naming!'),

  // Copy Me
  m('2-3', 'animals', 'cognitive', 'copy', 'Clap your hands 3 times!',
    'Count out loud: "one, two, three!"', 'One, two, three! Yay!'),
  m('2-3', 'jungle', 'motor', 'copy', 'Jump like a frog!',
    'Crouch low and jump up together.', 'Boing! Great jumping!'),
  m('2-3', 'space', 'motor', 'copy', 'Spin around slowly!',
    'Hold hands so nobody gets dizzy.', 'Wheee! Spinny fun!'),
  m('2-3', 'colors', 'motor', 'copy', 'Touch your toes!',
    'Bend down together and wiggle your toes.', 'You touched your toes!'),
  m('2-3', 'ocean', 'motor', 'copy', 'Wiggle like a wave!',
    'Sway side to side together.', 'Wiggly wave! Yay!'),
  m('2-3', 'animals', 'social', 'copy', 'Give a high five!',
    'Hold your hand up and wait for the slap.', 'High five! Boom!'),

  // Animal Adventure
  m('2-3', 'animals', 'motor', 'animal', 'Walk like an elephant, swing your trunk!',
    'Clasp hands as a trunk and stomp slowly.', 'Big elephant steps! Yay!'),
  m('2-3', 'jungle', 'motor', 'animal', 'Hop like a bunny!',
    'Make bunny ears with your hands and hop.', 'Hop hop bunny!'),
  m('2-3', 'jungle', 'language', 'animal', 'Roar like a lion and show your claws!',
    'Practice a "big" then "small" roar.', 'Mighty roar! Rawr!'),
  m('2-3', 'ocean', 'motor', 'animal', 'Swim like a fish!',
    'Put hands together and "swim" through the air.', 'Swishy fish! Great!'),
  m('2-3', 'animals', 'language', 'animal', 'Make a snake sound: sssss!',
    'Wiggle your arm like a slithering snake.', 'Ssssuper snake!'),
  m('2-3', 'animals', 'motor', 'animal', 'Waddle like a duck and say quack!',
    'Waddle side to side together.', 'Quack quack! Waddle pro!'),

  // Emotion Play
  m('2-3', 'colors', 'emotion', 'emotion', 'Show me a HAPPY face!',
    'Name the feeling: "You look happy!"', 'So happy! I love it!'),
  m('2-3', 'space', 'emotion', 'emotion', 'Show me a SURPRISED face!',
    'Open your mouth wide and gasp together.', 'Wow! What a surprise!'),
  m('2-3', 'animals', 'emotion', 'emotion', 'Make a SILLY face!',
    'Take turns making silly faces.', 'So silly! Hee hee!'),
  m('2-3', 'ocean', 'pretend', 'emotion', 'Pretend to be SLEEPY... big yawn!',
    'Yawn and stretch together.', 'Sleepy yawn! Great pretending!'),

  // Pretend / Object naming
  m('2-3', 'jungle', 'pretend', 'copy', 'Pretend to eat a banana!',
    'Peel an invisible banana together.', 'Yum yum! Great pretend!'),
  m('2-3', 'space', 'pretend', 'copy', 'Pretend to drink from a cup!',
    'Make a "gulp gulp" sound.', 'Gulp gulp! Tasty!'),

  // Story Builder (2–3)
  m('2-3', 'jungle', 'language', 'story', 'A little monkey found a... which one?',
    'Read the choices aloud and let them point.', 'What a fun story!',
    ['Banana', 'Hat', 'Drum']),
  m('2-3', 'ocean', 'language', 'story', 'A happy fish swam to a... pick one!',
    'Say each choice and act excited.', 'Great storytelling!',
    ['Shell', 'Boat', 'Star']),

  // ───────────────────────────── 3–4 YEARS ─────────────────────────────
  // Two-step instructions, counting 1–5, shapes, emotions, choices, memory, story.

  // Treasure Hunt (two-step + counting + shapes)
  m('3-4', 'colors', 'cognitive', 'treasure', 'Find something BLUE, then put it on the table.',
    'Two steps! Repeat the steps if needed.', 'You did both steps! Wow!'),
  m('3-4', 'colors', 'cognitive', 'treasure', 'Find 3 things that are the same color.',
    'Count each one: "one, two, three!"', 'Three matches! Color champ!'),
  m('3-4', 'jungle', 'cognitive', 'treasure', 'Find something shaped like a CIRCLE.',
    'Trace the circle and name another round thing.', 'Perfect circle find!'),
  m('3-4', 'space', 'cognitive', 'treasure', 'Find something shaped like a SQUARE.',
    'Count the 4 sides together.', 'Square master! Yay!'),
  m('3-4', 'ocean', 'cognitive', 'treasure', 'Find 5 small things and line them up.',
    'Count to five as you place each one.', 'Five in a row! Amazing!'),
  m('3-4', 'animals', 'cognitive', 'treasure', 'Find something soft AND something hard.',
    'Compare them: "Which feels nicer?"', 'Soft and hard! Smart!'),
  m('3-4', 'colors', 'language', 'treasure', 'Find something orange and tell me where you found it.',
    'Ask "Where was it hiding?"', 'Great describing!'),
  m('3-4', 'jungle', 'cognitive', 'treasure', 'Find something tall, then something short.',
    'Stand them next to each other to compare.', 'Tall and short! Yay!'),

  // Copy Me (two-step + counting)
  m('3-4', 'animals', 'motor', 'copy', 'Clap 4 times, then stomp 2 times!',
    'Count claps and stomps out loud.', 'Clap and stomp! Perfect!'),
  m('3-4', 'space', 'motor', 'copy', 'Jump up high 5 times!',
    'Count each jump together.', 'Five big jumps! Wow!'),
  m('3-4', 'jungle', 'motor', 'copy', 'Touch your head, then touch your toes!',
    'Say "head... toes!" in order.', 'Head to toes! Great memory!'),
  m('3-4', 'ocean', 'motor', 'copy', 'Spin around, then freeze like a statue!',
    'Make the freeze part a fun game.', 'Spin and freeze! Yay!'),
  m('3-4', 'colors', 'cognitive', 'copy', 'March in place and count to 5!',
    'March together and count each step.', 'March march! 1-2-3-4-5!'),

  // Animal Adventure (movement + sequencing)
  m('3-4', 'jungle', 'motor', 'animal', 'Walk like an elephant, then roar like a lion!',
    'Two animals, two steps — do them in order.', 'Elephant AND lion! Wow!'),
  m('3-4', 'animals', 'language', 'animal', 'Be a bird: flap your wings and tweet 3 times!',
    'Count the tweets together.', 'Tweet tweet tweet! Fly high!'),
  m('3-4', 'ocean', 'motor', 'animal', 'Be a crab and walk sideways!',
    'Pinch your fingers like claws.', 'Sideways crab! So clever!'),
  m('3-4', 'animals', 'motor', 'animal', 'Gallop like a horse and say neigh!',
    'Gallop in a little circle.', 'Neigh! Gallop champion!'),
  m('3-4', 'jungle', 'motor', 'animal', 'Stretch tall like a giraffe, then curl up small like a mouse.',
    'Talk about big and small bodies.', 'Tall AND small! Brilliant!'),

  // Emotion Play (naming + pretend)
  m('3-4', 'colors', 'emotion', 'emotion', 'Show me happy, then show me sad.',
    'Name each feeling as they make the face.', 'Happy and sad! Great feelings!'),
  m('3-4', 'space', 'emotion', 'emotion', 'Show me an EXCITED face like a rocket is launching!',
    'Count "3-2-1 blast off!" together.', 'Blast off! So excited!'),
  m('3-4', 'animals', 'emotion', 'emotion', 'Make a SCARED face, then a BRAVE face.',
    'Talk about how brave they are.', 'So brave! Well done!'),
  m('3-4', 'ocean', 'emotion', 'emotion', 'Show me a face when you taste something YUCKY!',
    'Be silly and stick out your tongue.', 'Yuck! Funny face!'),

  // Pretend Play
  m('3-4', 'jungle', 'pretend', 'copy', 'Pretend to be a tree blowing in the wind.',
    'Sway your arms like branches.', 'Whoosh! Lovely tree!'),
  m('3-4', 'space', 'pretend', 'copy', 'Pretend to fly a rocket to the moon!',
    'Count down "3-2-1" before lift off.', 'To the moon! Yay!'),
  m('3-4', 'animals', 'pretend', 'copy', 'Pretend to feed a hungry puppy.',
    'Talk about being gentle and kind.', 'So caring! Good job!'),

  // Memory game
  m('3-4', 'colors', 'cognitive', 'copy', 'Remember: red, blue! Now say them back.',
    'Say the two colors, then let them repeat.', 'Great remembering!'),
  m('3-4', 'animals', 'cognitive', 'copy', 'Remember 3 animals: cat, dog, cow. Can you say them?',
    'Repeat slowly, then cheer for any they recall.', 'Super memory!'),

  // Story Builder (3–4)
  m('3-4', 'jungle', 'language', 'story', 'Once upon a time, a little dinosaur found a...',
    'Read all three and let your child choose.', 'What a roar-some story!',
    ['Apple', 'Car', 'Star']),
  m('3-4', 'space', 'language', 'story', 'A brave astronaut blasted off and met a...',
    'Encourage your child to add their own words.', 'Out-of-this-world story!',
    ['Alien', 'Robot', 'Comet']),
  m('3-4', 'ocean', 'language', 'story', 'Deep in the sea, a curious turtle discovered a...',
    'Ask "What happens next?" after the story.', 'Splashing good tale!',
    ['Treasure', 'Mermaid', 'Whale']),
  m('3-4', 'animals', 'language', 'story', 'On the farm, a sleepy sheep wanted to...',
    'Let your child act out the choice.', 'Baa-rilliant story!',
    ['Dance', 'Sing', 'Nap']),
  m('3-4', 'colors', 'language', 'story', 'A rainbow painter ran out of paint and used a...',
    'Talk about the colors in a rainbow.', 'Colorful story! Wow!',
    ['Flower', 'Crayon', 'Cloud']),

  // ─────────────────────── MORE MISSIONS (variety top-up) ───────────────────────

  // 1–2 extras
  m('1-2', 'ocean', 'language', 'animal', 'Make a fishy face: pucker your lips!',
    'Pucker your lips together and giggle.', 'Blub blub! Cute fish!'),
  m('1-2', 'space', 'motor', 'copy', 'Reach up high to the stars!',
    'Stretch up together and say "up!"', 'Up to the stars! Yay!'),
  m('1-2', 'colors', 'language', 'treasure', 'Find something WHITE.',
    'Name it: "White sock!"', 'White find! Hooray!'),
  m('1-2', 'jungle', 'motor', 'animal', 'Stomp like a big dinosaur!',
    'Stomp slowly and say "stomp".', 'Stompy dino! Rawr!'),
  m('1-2', 'animals', 'social', 'copy', 'Give a gentle hug!',
    'Open your arms for a hug.', 'Best hug ever!'),
  m('1-2', 'ocean', 'cognitive', 'treasure', 'Find something that floats... or pretend!',
    'Talk about things that float in the bath.', 'Floaty fun! Yay!'),
  m('1-2', 'colors', 'emotion', 'emotion', 'Show me a sleepy face... yaaawn.',
    'Yawn together and rub your eyes.', 'So sleepy! Sweet!'),

  // 2–3 extras
  m('2-3', 'space', 'cognitive', 'treasure', 'Find something that is up HIGH.',
    'Point up and say "high!"', 'Way up high! Great!'),
  m('2-3', 'colors', 'language', 'treasure', 'Find something purple and say its name.',
    'Repeat the color and object together.', 'Purple pro! Nice!'),
  m('2-3', 'jungle', 'motor', 'copy', 'Tiptoe quietly like a sneaky cat!',
    'Tiptoe together and whisper.', 'Sneaky tiptoes! Yay!'),
  m('2-3', 'animals', 'language', 'animal', 'Make a frog sound: ribbit!',
    'Ribbit and hop at the same time.', 'Ribbit! Great froggy!'),
  m('2-3', 'ocean', 'pretend', 'copy', 'Pretend to splash in the water!',
    'Make splashy sounds together.', 'Splash splash! Yay!'),
  m('2-3', 'space', 'emotion', 'emotion', 'Show me a proud face — you did it!',
    'Cheer and clap for them.', 'So proud of you!'),
  m('2-3', 'colors', 'cognitive', 'treasure', 'Find one thing, then find two things.',
    'Count: "one... now two!"', 'One and two! Yay!'),
  m('2-3', 'animals', 'social', 'copy', 'Wave bye-bye to Buddy!',
    'Wave together and say "bye-bye".', 'Bye-bye! See you soon!'),

  // 3–4 extras
  m('3-4', 'jungle', 'cognitive', 'treasure', 'Find something green, then count its parts.',
    'Count leaves, buttons, or stripes together.', 'Counting champ! Yay!'),
  m('3-4', 'space', 'cognitive', 'copy', 'Hop on one foot 3 times!',
    'Hold a hand for balance and count hops.', 'Balancing star! Wow!'),
  m('3-4', 'ocean', 'language', 'treasure', 'Find something blue and tell me a word that rhymes.',
    'Try "blue... shoe... boo!" together.', 'Rhyme time! Brilliant!'),
  m('3-4', 'animals', 'cognitive', 'copy', 'Touch your ears, your nose, then your knees!',
    'Three steps — go slowly and in order.', 'Ears, nose, knees! Wow!'),
  m('3-4', 'colors', 'cognitive', 'treasure', 'Find a triangle shape — count the 3 corners.',
    'Trace each corner as you count.', 'Three corners! Shape star!'),
  m('3-4', 'jungle', 'pretend', 'emotion', 'Pretend you found a treasure — show me excited!',
    'Open an imaginary chest together.', 'Treasure! So exciting!'),
  m('3-4', 'space', 'language', 'story', 'A tiny robot beeped and wanted to find a...',
    'Let your child make the robot voice.', 'Beep boop! Great story!',
    ['Friend', 'Key', 'Song']),
];

export default missions;

/**
 * Tiny silly-story generator for Story Builder. Kept here (data-adjacent) and
 * deterministic so it is trivial to unit test. Future versions can replace this
 * with an AI call without changing callers.
 */
export function buildStory(prompt, choice) {
  const stem = prompt.replace(/\.\.\.$/, '').replace(/which one\?$/i, '').trim();
  const c = String(choice || 'surprise').toLowerCase();
  return (
    `${stem} ${choice}! ` +
    `The ${c} was magical and started to giggle. ` +
    `Everyone laughed and danced all day long. The End!`
  );
}
