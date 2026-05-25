export interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  authorAffiliation?: string;
  date: string;
  genre: 'nonfiction' | 'fiction-prose' | 'fiction-poetry' | 'review' | 'other';
  excerpt: string;
  content: string;
  imageUrl?: string;
  columnSlug?: string;
  tags?: string[];
}

export interface Column {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  color: string;
}

export interface Volume {
  slug: string;
  title: string;
  season: string;
  year: string;
  theme: string;
  imageUrl: string;
  issues: Issue[];
}

export interface Issue {
  slug: string;
  title: string;
  season: string;
  year: string;
  quote: string;
  quoteAuthor: string;
  content: string;
}

export const articles: Article[] = [
  {
    id: '1',
    slug: 'chasing-stars',
    title: 'Chasing Stars',
    author: 'Jeff Li',
    date: 'Jan 25, 2025',
    genre: 'nonfiction',
    excerpt: 'Why the study of Astronomy deserves more attention from the Public. What is your reaction when someone talks about Astronomy? Hate it, or love it? Indeed, everyone has seen the stars at night...',
    imageUrl: '/images/articles/chasingstar.png',
    content: `What is your reaction when someone talks about Astronomy? Hate it, or love it? Indeed, everyone has seen the stars at night, in the past, or at least heard of Elon Musk, who is keen on his dream of sending humans to Mars; however, how much do we know about the Universe? As far as I am concerned, no one on Earth can confidently say he or she knows everything going on in the universe, unless, he is the greatest astrophysicist that has ever existed. Therefore, I think that astronomy is not taken seriously enough by the public.\n\nAstronomy is the scientific study of celestial objects (such as stars, planets, comets, galaxies) and phenomena that originate outside the Earth's atmosphere. It is a branch of science that deals with the physical and chemical nature of celestial bodies, as well as their positions, motions, and origins. However, due to its nature as an academic discipline, many people may perceive astronomy as a subject far removed from everyday life.\n\nYet this perception is deeply flawed. As Carl Sagan famously said, "We are a way for the cosmos to know itself." Astronomy connects us to something far grander than our daily concerns. It reminds us of our place in the universe and inspires a sense of wonder that no other field can replicate.\n\nIn an age dominated by screens, social media, and instant gratification, astronomy offers something profoundly different — perspective. Looking up at the night sky, we are confronted with the sheer scale of existence. This encounter with the infinite can be transformative, sparking philosophical reflection and a deeper appreciation for our fragile, beautiful planet.\n\nFurthermore, astronomical discoveries have practical applications that affect our daily lives. GPS technology, weather forecasting, and even the internet infrastructure all rely on satellite systems and space-based observations. The study of asteroids and near-Earth objects helps protect our planet from potential impacts. Solar physics research informs our understanding of climate change and energy generation.\n\nThe argument that astronomy is "irrelevant" to ordinary people ignores these tangible contributions and the profound psychological benefits of cosmic wonder. In an educational context, astronomy also serves as an excellent gateway to physics, mathematics, and engineering — fields that are critical to our technological future.\n\nAs students at BASIS China, we are uniquely positioned to pursue these questions. The stars have been a source of inspiration for poets, philosophers, and scientists across every civilization. They ask us to look beyond our immediate surroundings and consider the grand narrative of existence.`,
    columnSlug: 'astronomical',
  },
  {
    id: '2',
    slug: 'silk-a-pantoum',
    title: 'Silk (A Pantoum)',
    author: 'Serotonin',
    date: 'Jan 25, 2025',
    genre: 'fiction-poetry',
    excerpt: 'Synthetic silk sewing, stitching, scribbling garment makers — Smoke was pumped into the sky — as usual. Fair factories formulating, fabulating, fabricating model workers...',
    imageUrl: '/images/articles/Silk(APantoum).png',
    content: `Synthetic silk sewing, stitching, scribbling garment makers —\nSmoke was pumped into the sky — as usual.\nFair factories formulating, fabulating, fabricating model workers —\nTens of thousands a day — nothing beautiful.\n\nAs usual, smoke was pumped into the sky —\nJet-black soot — pigmenting the laborers' uniforms whole—\nTens of thousands a day — nothing beautiful.\nCinder conquering all bodily airways, filled with a reminder of reality.\n\nJet-black soot was pigmenting the laborers' uniforms whole—\nThe machinery hums a song of indifference,\nCinder conquering all bodily airways, filled with a reminder of reality.\nThe factory walls, breathing pollution.\n\nThe machinery hums a song of indifference,\nThe price tag says $20, a lie stitched in synthetic thread.\nThe factory walls, breathing pollution.\nWe wear the sky's pain.\n\nThe price tag says $20, a lie stitched in synthetic thread.\nWe shake our heads, we scroll past,\nWe wear the sky's pain.\nFair factories formulating, fabulating, fabricating model workers —\n\nWe shake our heads, we scroll past,\nSmoke was pumped into the sky — as usual.\nSynthetic silk sewing, stitching, scribbling garment makers —\nTens of thousands a day — nothing beautiful.`,
  },
  {
    id: '3',
    slug: 'republic-of-amnesia-a-sestina',
    title: 'Republic of Amnesia (A Sestina)',
    author: 'Serotonin',
    date: 'Jan 25, 2025',
    genre: 'fiction-poetry',
    excerpt: 'We flip to an empty page as your emptiness fails to flip the switch of our minds, dragging, droning, drowning, Pulses burning, electrocuting...',
    imageUrl: '/images/articles/RepublicOfAmnesia.png',
    content: `We flip to an empty page as your emptiness fails to flip\nThe switch of our minds, dragging, droning, drowning,\nPulses burning, electrocuting, demanding us to stay behind.\nYour 16-hour production target, checkbox unchecked every time.\n\nUntil our hearts turn, until our heads and the walls turn,\nAnd turn the bleak sky and the black fly and the blurred lights too.\nTurn the turning wheels and widening gyre in our minds too.\nTurn the turning threads that twine around and knot in knots of grief.\n\nAnd turn the bleak sky and the black fly and the blurred lights too.\nWe watch the screen's glow paint our faces in sickly blue.\nTurn the turning wheels and widening gyre in our minds too.\nWe type and delete, we work and repeat, in the factory of days.\n\nTurn the turning threads that twine around and knot in knots of grief.\nYour checkbox unchecked, our spirits in decline.\nWe type and delete, we work and repeat, in the factory of days.\nUntil the night shift ends, until the alarm rings again.\n\nWe watch the screen's glow paint our faces in sickly blue.\nUntil our hearts turn, until our heads and the walls turn.\nUntil the night shift ends, until the alarm rings again.\nYour 16-hour production target, checkbox unchecked every time.`,
  },
  {
    id: '4',
    slug: 'exorbitant-price-of-cheap-clothes',
    title: "The Exorbitant Price of Cheap Clothes: Fast Fashion's Humanitarian and Environmental Implications",
    author: 'Albert Wang',
    authorAffiliation: 'BIPH, first published in Harvard International Review, 2022',
    date: 'Jan 25, 2025',
    genre: 'nonfiction',
    excerpt: "Thick, black smoke pumped into the bleak sky. Cramped workplaces pervaded by pungent miasma of chemicals. A pair of jeans for sale at 20 dollars on Amazon. We seldom associate the first two scenes to the third...",
    imageUrl: '/images/articles/TheExorbitantPriceofCheapCloth.png',
    content: `Thick, black smoke pumped into the bleak sky. Cramped workplaces pervaded by pungent miasma of chemicals. A pair of jeans for sale at 20 dollars on Amazon. We seldom associate the first two scenes to the third; however, responsible for 10% of global CO2 emission and 1.4 million work-related injuries per year, the fashion industry's acceleration and expansion is bringing pressing yet commonly ignored repercussions.\n\nFast fashion — defined by Merriam-Webster as "an approach to fashion design, creation, and marketing that emphasizes making fashion trends quickly and cheaply available to consumers" — has fundamentally transformed how we produce and consume clothing. What was once a seasonal industry has become a continuous cycle of production and disposal, with some retailers releasing new collections as often as weekly.\n\nThe environmental cost of this model is staggering. Beyond carbon emissions, the fashion industry is the second-largest consumer of water worldwide, and textile dyeing is responsible for 20% of global industrial water pollution. Synthetic fabrics like polyester shed microplastics with every wash, accumulating in our oceans and food chain.\n\nThe humanitarian dimension is equally grave. The majority of fast fashion manufacturing occurs in developing countries where labor protections are weak. Workers — predominantly women and children — face poverty wages, unsafe conditions, and hours that would be illegal in developed nations. The 2013 Rana Plaza disaster in Bangladesh, which killed 1,134 garment workers, remains a stark symbol of this exploitation.\n\nYet consumer demand continues to grow, driven by low prices, social media influence, and a culture of disposability. The solution requires systemic change: stronger international labor standards, corporate accountability, and a fundamental shift in consumer behavior toward slower, more intentional fashion consumption.\n\nAs young writers and thinkers, we have a responsibility to question the systems that produce the goods we consume without thought. The price tag is never the true price.`,
    columnSlug: 'whale-done',
  },
  {
    id: '5',
    slug: 'on-selfishness',
    title: 'On Selfishness',
    author: 'Timmy Zhang',
    authorAffiliation: "BIPH '25, AP Lang. argumentative essay",
    date: 'Jan 25, 2025',
    genre: 'nonfiction',
    excerpt: "When there is an apple on the table, the decision of either eating it or giving it to people who are more hungry is the difference between selfishness and selflessness...",
    imageUrl: '/images/articles/OnSelfishness.png',
    content: `When there is an apple on the table, the decision of either eating it or giving it to people who are more hungry is the difference between selfishness and selflessness. We all need basic necessities, like food and shelter, but we sometimes share essential and non-essential items to others out of altruism.\n\nThough the concept of selflessness conveys the best of humanity, mankind's practical future to survive and fight against challenges requires a delicate balance between self-interest and concern for others. This essay argues that while selflessness is morally admirable, selfishness in moderation serves as a practical foundation for individual survival and societal progress.\n\nAt first glance, selfishness is often condemned as morally reprehensible. Philosophers from Aristotle to Ayn Rand have debated its merits extensively. However, a closer examination reveals that certain forms of self-interest are not only natural but necessary. Psychologists suggest that self-care is not selfish — it is essential. A person who constantly sacrifices their own wellbeing for others eventually depletes themselves, becoming unable to help anyone.\n\nFurthermore, innovation and progress are often driven by self-interest. Entrepreneurs create products not purely out of altruism but because they seek to improve their own circumstances. Competition, fueled by self-interest, drives excellence in science, art, and commerce. Without some degree of self-interest, the engine of human advancement would sputter.\n\nThis is not to argue that unbridled selfishness is desirable. The most functional societies balance individual initiative with communal responsibility. The key is recognizing that selfishness and selflessness exist on a spectrum, not as binary opposites.\n\nIn conclusion, while pure selflessness is noble, it is neither sustainable nor universally applicable. A measured selfishness, one that respects the rights and needs of others while attending to one's own wellbeing, may be the more pragmatic path forward.`,
    columnSlug: 'inkmagination',
  },
  {
    id: '6',
    slug: 'most-beautiful-in-its-erasure',
    title: "Most Beautiful in Its Erasure: Washington's Speech and Commoner's Diary",
    author: 'Timmy Zhang',
    authorAffiliation: "BIPH '25, 2016 AP Lang Synthesis",
    date: 'Jan 25, 2025',
    genre: 'nonfiction',
    excerpt: 'Generally speaking, preserving records of our past is indeed important, but gathering everyday thoughts might be a different matter entirely...',
    content: `Generally speaking, preserving records of our past is indeed important, but gathering everyday thoughts might be a different matter entirely. In Frederick Douglass's famous speech "What to the Slave Is the Fourth of July?" and Virginia Woolf's novel "The Hours," both authors explore the paradox of historical record-keeping — how documentation can simultaneously empower and erase.\n\nDouglass's speech is a masterwork of rhetorical precision. Speaking to an audience of abolitionists on July 5, 1852, he navigates the irony of celebrating freedom while enslaved people suffer under the very nation being praised. His rhetorical strategy is subtle: he invokes the founding documents, then systematically reveals their hollowness for Black Americans. The speech becomes a form of preservation — keeping a record of suffering that the dominant culture would prefer to forget.\n\nWoolf's "The Hours," meanwhile, examines how the act of recording daily life can itself become a form of erasure. The characters — Clarissa Vaughan, Mrs. Dalloway, and Laura Brown — are all, in different ways, consumed by the need to document, to plan, to curate. Their meticulous attention to surfaces obscures deeper truths about loneliness, desire, and mortality.\n\nBoth works suggest that what is preserved in historical record is often what the powerful choose to remember. The everyday experiences of the marginalized, the intimate textures of ordinary life — these are systematically erased in favor of grand narratives.\n\nYet both authors also suggest that erasure is not total. Douglass's speech survives precisely because it names what was meant to be forgotten. Woolf's novel, through its fragmented structure, honors what surfaces cannot contain. In the end, the most beautiful records may be those that acknowledge what they cannot fully capture.`,
    columnSlug: 'inkmagination',
  },
  {
    id: '7',
    slug: 'betting-with-gods',
    title: 'Betting With Gods',
    author: 'Anonymous',
    authorAffiliation: 'BIPH',
    date: 'Jan 25, 2025',
    genre: 'fiction-prose',
    excerpt: 'There are several reasons why I am not willing to make a bet with God. Primarily, He is an almighty and powerful deity capable of controlling everything...',
    imageUrl: '/images/articles/BettingWithGods.png',
    content: `There are several reasons why I am not willing to make a bet with God. Primarily, He is an almighty and powerful deity capable of controlling everything, including the outcome of a simple coin toss. Moreover, betting is not encouraged in the Holy Bible. Considering this, I believe that any result stemming from such a bet must serve a greater purpose.\n\nHypothetically, if I were to age 15 years instantly — making me 30 with the abilities of a 15-year-old — I would likely struggle to navigate the expectations placed upon a 30-year-old. Employers would demand experience I don't possess. Friends would expect emotional maturity that a teenager simply cannot offer. The dissonance between appearance and reality would be exhausting.\n\nFurthermore, the question of what God gains from this transaction remains unanswered. In mythology, deals with deities rarely benefit the mortal party. Tantalus was cursed to stand in water that receded when he tried to drink. Sisyphus was condemned to roll a boulder up a hill for eternity. Divine bargains are almost always traps.\n\nPerhaps the most compelling reason to refuse the bet is philosophical. If God can alter time for one individual, what prevents Him from doing so for everyone? The fabric of causality — the principle that cause precedes effect — would unravel. Without a reliable sequence of events, nothing we experience could be trusted.\n\nUltimately, betting with gods is not a matter of courage or cowardice. It is a matter of wisdom. Some games, regardless of the potential reward, are not worth playing.`,
    columnSlug: 'inkmagination',
  },
  {
    id: '8',
    slug: 'suffocate',
    title: 'Suffocate',
    author: 'Tracy Shao Weiqi',
    authorAffiliation: 'BIBWH',
    date: 'Jan 19, 2025',
    genre: 'fiction-poetry',
    excerpt: 'As the crash of waves echoed, Darkness blinded my sight. Although She in pain had moaned, It was peaceful without...',
    imageUrl: '/images/articles/Suffocate.jpg',
    content: `As the crash of waves echoed,\nDarkness blinded my sight.\nAlthough She in pain had moaned,\nIt was peaceful without.\n\nThe tide pulled Her under,\nA lullaby of foam.\nSaltwater and sorrow,\nMingled — Her final home.\n\nI watched from the shore,\nMy voice drowned in spray.\nThe ocean took Her\nOn that fateful day.\n\nNow I walk the beachfront,\nWith sand between my toes,\nWondering if the sea\nEver feels shame for what it knows.`,
  },
  {
    id: '9',
    slug: 'lonely-after-death',
    title: 'Lonely After Death',
    author: 'Peter Li',
    authorAffiliation: 'BIPH',
    date: 'Jan 19, 2025',
    genre: 'fiction-poetry',
    excerpt: "In death's embrace, no unity we find, But solitude, a vast expanse unkind. 'We brethren are,' the echo sighs, We're all...",
    imageUrl: '/images/articles/LonelyAfterDeath.jpg',
    content: `In death's embrace, no unity we find,\nBut solitude, a vast expanse unkind.\n"We brethren are," the echo sighs,\nWe're all just lonely souls that rise.\n\nThe afterlife — a grand deception, perhaps?\nA wish our mortal hearts craft in their maps.\nWe dream of reunions, of bridges built,\nBut the void between — can it ever be kilt?\n\nGraves lie side by side, stone after stone,\nYet the consciousness within — are they truly one?\nOr do they drift in separate, silent seas,\nEternally alone,隔着永恒的窗户凝望?\n\nPerhaps death is not the end of self,\nBut the ultimate unveiling of it.\nNo longer bound by others' reflections,\nWe become — at last — only what we are.`,
  },
  {
    id: '10',
    slug: 'rain',
    title: 'Rain',
    author: 'Freya Nie',
    authorAffiliation: 'BIPH',
    date: 'Jan 19, 2025',
    genre: 'fiction-poetry',
    excerpt: 'A mourning shade of yellow, Paints over the starry night. The reflection of my dulled eyes show Heavy clouds of blue on my right...',
    imageUrl: '/images/articles/Rain.jpg',
    content: `A mourning shade of yellow,\nPaints over the starry night.\nThe reflection of my dulled eyes show\nHeavy clouds of blue on my right.\n\nA small droplet of rain,\nRolls down the leaves of a tree.\nI rub my eyes in pain,\nHoping for someplace to flee.\n\nI stare at the droplet of rain,\nObserving it slowly disintegrate.\nMy senses begin to fade,\nAs I watch my vision turning grey.\n\n——\n\nWiping out all light,\nMy hopes, nowhere in sight.`,
    columnSlug: 'inkmagination',
  },
  {
    id: '11',
    slug: 'the-yeti',
    title: 'The Yeti (David Cheng, BIPH)',
    author: 'David Cheng',
    authorAffiliation: 'BIPH',
    date: 'Jan 19, 2025',
    genre: 'fiction-prose',
    excerpt: "It might have been a beautiful day; If we had not waken up, To find the world in fray...",
    content: `It might have been a beautiful day;\nIf we had not waken up,\nTo find the world in fray.\n\nThey could have given warning,\nThe government, the news, anyone,\nBefore the creatures came.\n\nNow we're all that's left,\nHuddled in the subway,\nListening to the thumps above.\n\nThe Yeti — massive, white, and terrible —\nStalks the frozen city above.\nAnd we, the last humans in Beijing,\nWait for dawn, or death, whichever comes first.`,
    columnSlug: 'inkmagination',
  },
  {
    id: '13',
    slug: 'is-that-a-mirror',
    title: "Is That A Mirror? No Silly, It's Just You",
    author: 'Anonymous',
    date: 'Jan 19, 2025',
    genre: 'fiction-prose',
    excerpt: 'The poem explores self-reflection, revealing cracks and duality within. It urges embracing one\'s truth and healing through understanding.',
    imageUrl: '/images/articles/IsThatAMirror.webp',
    content: `The poem explores self-reflection, revealing cracks and duality within. It urges embracing one's truth and healing through understanding.\n\nWho is that in the mirror?\nNot the face I constructed each morning,\nBut something rawer, older,\nPeeling back the layers I thought were mine.\n\nWe perform ourselves daily,\nA play with no intermission.\nBut mirrors don't applaud;\nThey simply show.\n\nWhat if I stopped performing?\nWhat if the mirror showed only truth —\nThe scars, the softness, the silence?\nWould I still recognize myself?\n\nThe answer, I think, is yes.\nAnd that recognition\nMight be the beginning of everything.`,
    columnSlug: 'inkmagination',
  },
  {
    id: '13',
    slug: 'recipe-spring',
    title: 'Recipe-Spring',
    author: 'Cxzh (Connie)',
    authorAffiliation: 'BIGZ',
    date: 'Jan 19, 2025',
    genre: 'fiction-poetry',
    excerpt: 'Dim light, Shadow, Moisty air, Life...',
    imageUrl: '/images/articles/RecipeSpring.webp',
    content: `Dim light\nShadow\nMoisty air\nLife\n\nMighty clouds\nRaindrops\nMarch love\nWarm breeze\nSweet scent\nBright green\nBloom\nWake`,
    columnSlug: 'inkmagination',
  },
  {
    id: '14',
    slug: 'free-will-laws-of-physics',
    title: 'Do we really have "free will" in a world governed by laws of physics?',
    author: 'Jiayu Li',
    date: 'Nov 3, 2025',
    genre: 'nonfiction',
    excerpt: 'We as human beings are constantly making choices, whether it is deciding what to have for dinner or how to respond to a friend\'s text message. The nature of these choices feels authentic...',
    content: `We as human beings are constantly making choices, whether it is deciding what to have for dinner or how to respond to a friend's text message. The nature of these choices feels authentic, as they are the manifestation of our desires and autonomous will. But is that "will" truly free? Scientists and philosophers have been debating this question for centuries.\n\nOn one side is the determinist arguing that the future is shaped by the causation of previous events and thus predetermined. Every thought we have, every decision we make, is the inevitable result of prior causes — our genetics, environment, upbringing, and the physical laws governing our neurons. If every effect has a cause, and causes chain backward through time, then our choices are not free but inevitable.\n\nOn the other side are those who believe in free will — that we are the ultimate originators of our actions, unconstrained by physical determinism. This view preserves moral responsibility and human dignity, arguing that consciousness can transcend mere mechanical causation.\n\nModern neuroscience complicates this debate. Benjamin Libet's famous experiments showed that brain activity associated with initiating movement begins several hundred milliseconds before the conscious decision to move. If the brain's preparatory signals precede our awareness of choosing, what does this mean for free will?\n\nHowever, Libet's findings have been contested. More recent research suggests that while unconscious processes initiate some actions, we retain the capacity to veto or inhibit them. Free will may not mean initiating actions from nothing, but rather exercising agency over which competing neural impulses we allow to manifest.\n\nUltimately, the question of free will may be less about metaphysics and more about practical reality. Regardless of whether our choices are ultimately determined, living as if we have free will — and holding ourselves and others accountable — remains essential for functioning societies and meaningful lives.`,
  },
  {
    id: '15',
    slug: 'womens-day-speech',
    title: "Speech on International Women's Day: Bringing Pothos to Light",
    author: 'Albert Wang',
    authorAffiliation: "BIPH '26",
    date: 'Apr 15, 2025',
    genre: 'nonfiction',
    excerpt: "The following is the transcript of a speech written and delivered to the school by Albert on International Women's Day, exploring the intersection of gender, labor, and visibility...",
    imageUrl: '/images/articles/SpeechOnInternationalWomensDay.jpg',
    content: `Good morning everyone. Today, on International Women's Day, I want to talk about something green and growing — a pothos plant.\n\nA few months ago, I noticed that the pothos plant in our school hallway had been quietly thriving despite being largely ignored. It receives no special treatment — no extra water, no fertilizer, no one checking on it daily. And yet it grows. It persists. It brings life to a corner of our building that would otherwise be sterile.\n\nI think of the women in our community — and beyond — who are like that pothos. They do the work that keeps institutions running, often without recognition, applause, or fair compensation. They teach, they nurse, they raise children, they organize communities, they create art. And like the pothos, they are often overlooked because they are everywhere, and because their presence feels so natural that we forget to question whether they are getting what they need.\n\nToday, I want to bring the pothos to light. Not to pedestalize it — a plant is not a perfect metaphor for any person — but to remind us that visibility matters. The work that is normalized, naturalized, expected, is still work. It still deserves acknowledgment, resources, and respect.\n\nTo the women in this room: thank you. To the men who support them: thank you for tending the soil.\n\nLet's commit to seeing what we've grown accustomed to overlooking. Let's bring pothos to light.`,
    columnSlug: 'whale-done',
  },
  {
    id: '16',
    slug: 'interview-student-council-president',
    title: 'Interview with BASIS PLH Student Council President',
    author: 'Editorial Team',
    authorAffiliation: 'The Mortals',
    date: 'Mar 1, 2025',
    genre: 'other',
    excerpt: 'An interview with the student council president of BASIS International School Park Lane Harbor, exploring leadership, student voice, and school culture...',
    imageUrl: '/images/articles/biphStuCoInterview.jpeg',
    content: `The Mortals sat down with the newly elected Student Council President to discuss their vision for the year ahead.\n\n**The Mortals: Congratulations on your election! What does student leadership mean to you?**\n\nStudent President: Thank you! To me, student leadership is about listening first and acting second. Too often, student government becomes performative — we plan events and feel busy, but forget to ask whether what we're doing actually serves the student body. My goal this year is to create more spaces for genuine feedback, not just surveys we send out and then ignore.\n\n**The Mortals: What do you see as the biggest challenge facing students at PLH?**\n\nI think it's the pressure to perform. We're all juggling academics, extracurriculars, college applications — there's a culture of relentless optimization. But at some point, optimizing every hour of every day makes us less effective, not more. I want the student council to advocate for more unstructured time, more space to simply be.\n\n**The Mortals: What can students expect from the council this year?**\n\nMore transparency, more responsiveness, and — I hope — more fun. We're launching a monthly "Open Floor" where any student can bring concerns or ideas directly to the council. No bureaucracy, no middlemen. Just a conversation.\n\n**The Mortals: Any final words?**\n\nI'd just say: use your voice. Every email you send, every suggestion you make, every time you speak up in a meeting — it matters. Student leadership isn't about a few elected positions. It's about all of us shaping the community we want to live in.`,
  },
];

export const columns: Column[] = [
  {
    slug: 'whale-done',
    name: 'Whale Done: UN SDGs',
    tagline: 'Sustainability & Social Impact on Campus',
    description: 'A dynamic program designed to promote the United Nations Sustainable Development Goals on our campus. By encouraging sustainable practices and fostering a culture of environmental awareness, we aim to inspire students and staff alike to take meaningful action towards a greener future.',
    imageUrl: '/images/col_whale_done.webp',
    color: '#4a9e8c',
  },
  {
    slug: 'inkmagination',
    name: 'Inkmagination',
    tagline: 'Fiction and Metafiction',
    description: 'A nexus of knowledge and creativity for comprehensive academic exploration, featuring expert advice, exemplary student writing samples, and strategic recommendations. A dedicated space for fiction, poetry, and literary experimentation.',
    imageUrl: '/images/col_inkmagination.jpg',
    color: '#5b9bd5',
  },
  {
    slug: 'forteenlines',
    name: 'Forteenlines',
    tagline: "Poets' Society",
    description: 'A dedicated column for poetry in all its forms — from traditional sonnets to experimental verse. Forteenlines celebrates the art of compression, the music of language, and the power of the well-turned line.',
    imageUrl: '/images/col_fourteen_lines.avif',
    color: '#8b6fc9',
  },
  {
    slug: 'astronomical',
    name: 'Astronomical Astonishment',
    tagline: 'Astrophysics and Beyond',
    description: 'Exploring the wonders of the cosmos — from black holes to the search for extraterrestrial life. Written by students passionate about the universe and our place within it.',
    imageUrl: '/images/col_astronomical.webp',
    color: '#5c8ad4',
  },
];

// Volume + issue text below is sourced verbatim from mortalsmag.com
// (the live publication). When updating, prefer the live wording —
// the editors' published copy is always canonical.
export const volumes: Volume[] = [
  {
    slug: 'summer-fall-2024',
    title: 'Summer / Fall 2024 Issue',
    season: 'Summer / Fall',
    year: '2024',
    theme: 'Narrative',
    imageUrl: '/images/volume_summer_fall.png',
    issues: [
      {
        slug: 'summer-fall-2024',
        title: 'Summer / Fall 2024 Issue',
        season: 'Summer / Fall',
        year: '2024',
        quote: '"On a clear day you can see forever"',
        quoteAuthor: '',
        content: `Human life rarely lasts beyond a century – we appear and vanish like flickers of light, a mere blink in the vast expanse of the cosmos. As mortals, our flesh may not endure through time's inevitability. Still, our arts, our cultures, and our thoughts may cross generations, as our magazine The Mortals seeks to broaden students' perspectives, aiming to impart knowledge, creativity, and the essence of humanity beyond the years spent on campus, beyond the "shelf life" of our mortal souls, celebrating individuality with connections to societies.\n\n"We do not need magic to transform our world. We carry all the power we need inside ourselves already." At our core, we, like J.K. Rowling, believe in the inner magic within each student. Everyone possesses a unique and powerful voice, ready to be heard and to inspire change. We are committed to nurturing this inner strength, empowering everyone to realize and express their authentic selves.\n\nThe first issue of The Mortals saw the realization of precisely this goal. Burgeoning young writers, poets, and storytellers joined us with their diverse and captivating writings. Aspiring young artists, developers, and designers joined us with their creative and innovative minds. From editors to designers, our mortal souls joined together to synthesize a harmony of literary and artistic expression.\n\nWe wish to express our gratitude for those who made possible this harmony of mortal souls. Thank you Mr. Dust for improving our ideas with concrete actions and constructive feedback; we are proud to have your incredible support and suggestions. Thank you Mr. Huizinga for proofreading our drafts from start to end; we are proud to say that all three student magazine editors at BIPH were once your students. Thank you Mr. Quirk and Ms. Hannah for leading us to the publishing stage; we are proud to be members of a growing and thriving literary community at Basis.\n\nThe first issue of The Mortals is just the end of a start – the road ahead is still so long, and our climb still so steep. On our way, we call upon young writers and artists to submit your work for consideration in our upcoming issues. We welcome anyone and everyone, beyond objectification and beyond doubt, beyond our limitations as mortals.\n\n— Timmy Zhang & Albert Wang, Editors-in-Chief`,
      },
    ],
  },
  {
    slug: 'winter-2024-25',
    title: 'Winter 2024-2025 Issue',
    season: 'Winter',
    year: '2024-2025',
    theme: 'Narrative',
    imageUrl: '/images/volume_winter.png',
    issues: [
      {
        slug: 'winter-2024-2025',
        title: 'Winter 2024-2025',
        season: 'Winter',
        year: '2024-2025',
        quote: '"In seed time learn, in harvest teach, in winter enjoy."',
        quoteAuthor: 'William Blake',
        content: `THE WINTER HARBINGER\n— Timmy Zhang, BIPH '25\n\nBright yellow clings to blue light,\nJingling in the starry, dotting winter-veiled sky.\nFluviatile Trees, with a thousand bristling fingers, weave\nBulbs and ribbons beneath the lush green leaves.\nSnowflakes, sharp and tight, sparkle fairly with the\nConfidence of an immaculate line of teeth—polished and\nProud and brimming among hights.\nThe wind glistens, swings and swoops and carries\nOur spirits high above onto the Olympus, as nature's eye\nSparkles with alpine delight.\nUs, wrapped in cool, fine moist.\nSoulbeats thudding like drums attracting an ancient figure:\nThe Old Grinning Man and his reindeers gliding\nAcross the sky.\nAs though Mortals fair from fair sometimes decline,\nBe cheerful, fellow players.\nOur brevity could be uplifted to essence of joy,\nTo feast on the music of the great light.\n\n— Albert Wang, BIPH '26\n\n"If the history of our shared narrative is a book, the 24-25 volume of The Mortals invites you to flip through its unfolding pages, flip beyond objectification – of stories, identities, and histories into rigidity, treaty, and monetization – and beyond doubt – of our stories, our identities, and our histories.\n\nWe invite you to flip to an empty page."`,
      },
    ],
  },
  {
    slug: '2025-2026',
    title: '2025-2026 Volume',
    season: 'Fall | Winter | Spring',
    year: '2025-2026',
    theme: 'Our Latest Volume',
    imageUrl: '',
    issues: [],
  },
];

export const editorsNote = {
  title: "Editor's Note",
  content: `Human life rarely lasts beyond a century — we appear and vanish like flickers of light, a mere blink in the vast expanse of the cosmos. As mortals, our flesh may not endure through time's inevitability. Still, our arts, our cultures, and our thoughts may cross generations, as our magazine The Mortals seeks to broaden students' perspectives, aiming to impart knowledge, creativity, and the essence of humanity beyond the years spent on campus, beyond the "shelf life" of our mortal souls, celebrating individuality with connections to societies.\n\n"We do not need magic to transform our world. We carry all the power we need inside ourselves already." At our core, we, like J.K. Rowling, believe in the inner magic within each student. Everyone possesses a unique and powerful voice, ready to be heard and to inspire change. We are committed to nurturing this inner strength, empowering everyone to realize and express their authentic selves.\n\nThe first issue of The Mortals saw the realization of precisely this goal. Burgeoning young writers, poets, and storytellers joined us with their diverse and captivating writings. Aspiring young artists, developers, and designers joined us with their creative and innovative minds. From editors to designers, our mortal souls joined together to synthesize a harmony of literary and artistic expression.\n\nWe wish to express our gratitude for those who made possible this harmony of mortal souls. Thank you Mr. Dust for improving our ideas with concrete actions and constructive feedback; we are proud to have your incredible support and suggestions. Thank you Mr. Huizinga for proofreading our drafts from start to end; we are proud to say that all three student magazine editors at BIPH were once your students. Thank you Mr. Quirk and Ms. Hannah for leading us to the publishing stage; we are proud to be members of a growing and thriving literary community at Basis.\n\nThe first issue of The Mortals is just the end of a start — the road ahead is still so long, and our climb still so steep. On our way, we call upon young writers and artists to submit your work for consideration in our upcoming issues. We welcome anyone and everyone, beyond objectification and beyond doubt, beyond our limitations as mortals.`,
  authors: ["Albert Wang ('26)", "Timmy Zhang ('25)"],
};
