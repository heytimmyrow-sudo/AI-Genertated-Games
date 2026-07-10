const SOURCES = {
  cia: { label: "CIA World Factbook", url: "https://www.cia.gov/the-world-factbook/" },
  nasa: { label: "NASA", url: "https://science.nasa.gov/solar-system/" },
  noaa: { label: "NOAA", url: "https://www.noaa.gov/" },
  un: { label: "United Nations", url: "https://www.un.org/en/about-us/member-states" },
  guinness: { label: "Guinness World Records", url: "https://www.guinnessworldrecords.com/" },
  worldBank: { label: "World Bank", url: "https://data.worldbank.org/" },
  olympics: { label: "International Olympic Committee", url: "https://olympics.com/ioc" },
  who: { label: "World Health Organization", url: "https://www.who.int/" },
  britannica: { label: "Encyclopaedia Britannica", url: "https://www.britannica.com/" },
  imdb: { label: "Film reference", url: "https://www.imdb.com/" },
  museum: { label: "Museum reference", url: "https://www.si.edu/" },
  gameHistory: { label: "Video game history reference", url: "https://www.museumofplay.org/" },
  countryData: { label: "World Countries dataset", url: "https://github.com/mledoze/countries" }
};

const CAPITALS = [
  ["Afghanistan", "Kabul"],
  ["Åland Islands", "Mariehamn"],
  ["Albania", "Tirana"],
  ["Algeria", "Algiers"],
  ["American Samoa", "Pago Pago"],
  ["Andorra", "Andorra la Vella"],
  ["Angola", "Luanda"],
  ["Anguilla", "The Valley"],
  ["Antigua and Barbuda", "Saint John's"],
  ["Argentina", "Buenos Aires"],
  ["Armenia", "Yerevan"],
  ["Aruba", "Oranjestad"],
  ["Australia", "Canberra"],
  ["Austria", "Vienna"],
  ["Azerbaijan", "Baku"],
  ["Bahamas", "Nassau"],
  ["Bahrain", "Manama"],
  ["Bangladesh", "Dhaka"],
  ["Barbados", "Bridgetown"],
  ["Belarus", "Minsk"],
  ["Belgium", "Brussels"],
  ["Belize", "Belmopan"],
  ["Benin", "Porto-Novo"],
  ["Bermuda", "Hamilton"],
  ["Bhutan", "Thimphu"],
  ["Bolivia", "Sucre"],
  ["Bosnia and Herzegovina", "Sarajevo"],
  ["Botswana", "Gaborone"],
  ["Brazil", "Brasília"],
  ["British Indian Ocean Territory", "Diego Garcia"],
  ["British Virgin Islands", "Road Town"],
  ["Brunei", "Bandar Seri Begawan"],
  ["Bulgaria", "Sofia"],
  ["Burkina Faso", "Ouagadougou"],
  ["Burundi", "Gitega"],
  ["Cambodia", "Phnom Penh"],
  ["Cameroon", "Yaoundé"],
  ["Canada", "Ottawa"],
  ["Cape Verde", "Praia"],
  ["Caribbean Netherlands", "Kralendijk, Oranjestad, The Bottom"],
  ["Cayman Islands", "George Town"],
  ["Central African Republic", "Bangui"],
  ["Chad", "N'Djamena"],
  ["Chile", "Santiago"],
  ["China", "Beijing"],
  ["Christmas Island", "Flying Fish Cove"],
  ["Cocos (Keeling) Islands", "West Island"],
  ["Colombia", "Bogotá"],
  ["Comoros", "Moroni"],
  ["Congo", "Brazzaville"],
  ["Cook Islands", "Avarua"],
  ["Costa Rica", "San José"],
  ["Croatia", "Zagreb"],
  ["Cuba", "Havana"],
  ["Curaçao", "Willemstad"],
  ["Cyprus", "Nicosia"],
  ["Czechia", "Prague"],
  ["Denmark", "Copenhagen"],
  ["Djibouti", "Djibouti"],
  ["Dominica", "Roseau"],
  ["Dominican Republic", "Santo Domingo"],
  ["DR Congo", "Kinshasa"],
  ["Ecuador", "Quito"],
  ["Egypt", "Cairo"],
  ["El Salvador", "San Salvador"],
  ["Equatorial Guinea", "Malabo"],
  ["Eritrea", "Asmara"],
  ["Estonia", "Tallinn"],
  ["Eswatini", "Lobamba"],
  ["Ethiopia", "Addis Ababa"],
  ["Falkland Islands", "Stanley"],
  ["Faroe Islands", "Tórshavn"],
  ["Fiji", "Suva"],
  ["Finland", "Helsinki"],
  ["France", "Paris"],
  ["French Guiana", "Cayenne"],
  ["French Polynesia", "Papeetē"],
  ["French Southern and Antarctic Lands", "Port-aux-Français"],
  ["Gabon", "Libreville"],
  ["Gambia", "Banjul"],
  ["Georgia", "Tbilisi"],
  ["Germany", "Berlin"],
  ["Ghana", "Accra"],
  ["Gibraltar", "Gibraltar"],
  ["Greece", "Athens"],
  ["Greenland", "Nuuk"],
  ["Grenada", "St. George's"],
  ["Guadeloupe", "Basse-Terre"],
  ["Guam", "Hagåtña"],
  ["Guatemala", "Guatemala City"],
  ["Guernsey", "St. Peter Port"],
  ["Guinea", "Conakry"],
  ["Guinea-Bissau", "Bissau"],
  ["Guyana", "Georgetown"],
  ["Haiti", "Port-au-Prince"],
  ["Honduras", "Tegucigalpa"],
  ["Hong Kong", "City of Victoria"],
  ["Hungary", "Budapest"],
  ["Iceland", "Reykjavik"],
  ["India", "New Delhi"],
  ["Indonesia", "Jakarta"],
  ["Iran", "Tehran"],
  ["Iraq", "Baghdad"],
  ["Ireland", "Dublin"],
  ["Isle of Man", "Douglas"],
  ["Israel", "Jerusalem"],
  ["Italy", "Rome"],
  ["Ivory Coast", "Yamoussoukro"],
  ["Jamaica", "Kingston"],
  ["Japan", "Tokyo"],
  ["Jersey", "Saint Helier"],
  ["Jordan", "Amman"],
  ["Kazakhstan", "Astana"],
  ["Kenya", "Nairobi"],
  ["Kiribati", "South Tarawa"],
  ["Kosovo", "Pristina"],
  ["Kuwait", "Kuwait City"],
  ["Kyrgyzstan", "Bishkek"],
  ["Laos", "Vientiane"],
  ["Latvia", "Riga"],
  ["Lebanon", "Beirut"],
  ["Lesotho", "Maseru"],
  ["Liberia", "Monrovia"],
  ["Libya", "Tripoli"],
  ["Liechtenstein", "Vaduz"],
  ["Lithuania", "Vilnius"],
  ["Luxembourg", "Luxembourg"],
  ["Madagascar", "Antananarivo"],
  ["Malawi", "Lilongwe"],
  ["Malaysia", "Kuala Lumpur"],
  ["Maldives", "Malé"],
  ["Mali", "Bamako"],
  ["Malta", "Valletta"],
  ["Marshall Islands", "Majuro"],
  ["Martinique", "Fort-de-France"],
  ["Mauritania", "Nouakchott"],
  ["Mauritius", "Port Louis"],
  ["Mayotte", "Mamoudzou"],
  ["Mexico", "Mexico City"],
  ["Micronesia", "Palikir"],
  ["Moldova", "Chișinău"],
  ["Monaco", "Monaco"],
  ["Mongolia", "Ulan Bator"],
  ["Montenegro", "Podgorica"],
  ["Montserrat", "Plymouth"],
  ["Morocco", "Rabat"],
  ["Mozambique", "Maputo"],
  ["Myanmar", "Naypyidaw"],
  ["Namibia", "Windhoek"],
  ["Nauru", "Yaren"],
  ["Nepal", "Kathmandu"],
  ["Netherlands", "Amsterdam"],
  ["New Caledonia", "Nouméa"],
  ["New Zealand", "Wellington"],
  ["Nicaragua", "Managua"],
  ["Niger", "Niamey"],
  ["Nigeria", "Abuja"],
  ["Niue", "Alofi"],
  ["Norfolk Island", "Kingston"],
  ["North Korea", "Pyongyang"],
  ["North Macedonia", "Skopje"],
  ["Northern Mariana Islands", "Saipan"],
  ["Norway", "Oslo"],
  ["Oman", "Muscat"],
  ["Pakistan", "Islamabad"],
  ["Palau", "Ngerulmud"],
  ["Palestine", "Ramallah"],
  ["Panama", "Panama City"],
  ["Papua New Guinea", "Port Moresby"],
  ["Paraguay", "Asunción"],
  ["Peru", "Lima"],
  ["Philippines", "Manila"],
  ["Pitcairn Islands", "Adamstown"],
  ["Poland", "Warsaw"],
  ["Portugal", "Lisbon"],
  ["Puerto Rico", "San Juan"],
  ["Qatar", "Doha"],
  ["Réunion", "Saint-Denis"],
  ["Romania", "Bucharest"],
  ["Russia", "Moscow"],
  ["Rwanda", "Kigali"],
  ["Saint Barthélemy", "Gustavia"],
  ["Saint Helena, Ascension and Tristan da Cunha", "Jamestown"],
  ["Saint Kitts and Nevis", "Basseterre"],
  ["Saint Lucia", "Castries"],
  ["Saint Martin", "Marigot"],
  ["Saint Pierre and Miquelon", "Saint-Pierre"],
  ["Saint Vincent and the Grenadines", "Kingstown"],
  ["Samoa", "Apia"],
  ["San Marino", "City of San Marino"],
  ["São Tomé and Príncipe", "São Tomé"],
  ["Saudi Arabia", "Riyadh"],
  ["Senegal", "Dakar"],
  ["Serbia", "Belgrade"],
  ["Seychelles", "Victoria"],
  ["Sierra Leone", "Freetown"],
  ["Singapore", "Singapore"],
  ["Sint Maarten", "Philipsburg"],
  ["Slovakia", "Bratislava"],
  ["Slovenia", "Ljubljana"],
  ["Solomon Islands", "Honiara"],
  ["Somalia", "Mogadishu"],
  ["South Africa", "Pretoria, Bloemfontein, Cape Town"],
  ["South Georgia", "King Edward Point"],
  ["South Korea", "Seoul"],
  ["South Sudan", "Juba"],
  ["Spain", "Madrid"],
  ["Sri Lanka", "Colombo"],
  ["Sudan", "Khartoum"],
  ["Suriname", "Paramaribo"],
  ["Svalbard and Jan Mayen", "Longyearbyen"],
  ["Sweden", "Stockholm"],
  ["Switzerland", "Bern"],
  ["Syria", "Damascus"],
  ["Taiwan", "Taipei"],
  ["Tajikistan", "Dushanbe"],
  ["Tanzania", "Dodoma"],
  ["Thailand", "Bangkok"],
  ["Timor-Leste", "Dili"],
  ["Togo", "Lomé"],
  ["Tokelau", "Fakaofo"],
  ["Tonga", "Nuku'alofa"],
  ["Trinidad and Tobago", "Port of Spain"],
  ["Tunisia", "Tunis"],
  ["Türkiye", "Ankara"],
  ["Turkmenistan", "Ashgabat"],
  ["Turks and Caicos Islands", "Cockburn Town"],
  ["Tuvalu", "Funafuti"],
  ["Uganda", "Kampala"],
  ["Ukraine", "Kyiv"],
  ["United Arab Emirates", "Abu Dhabi"],
  ["United Kingdom", "London"],
  ["United States", "Washington D.C."],
  ["United States Virgin Islands", "Charlotte Amalie"],
  ["Uruguay", "Montevideo"],
  ["Uzbekistan", "Tashkent"],
  ["Vanuatu", "Port Vila"],
  ["Vatican City", "Vatican City"],
  ["Venezuela", "Caracas"],
  ["Vietnam", "Hanoi"],
  ["Wallis and Futuna", "Mata-Utu"],
  ["Western Sahara", "El Aaiún"],
  ["Yemen", "Sana'a"],
  ["Zambia", "Lusaka"],
  ["Zimbabwe", "Harare"]
];

const RAW_FACTS = [
  ...CAPITALS.map(([country, capital]) => entry(
    "world-capitals",
    country,
    `The capital of ${country} is ${capital}.`,
    SOURCES.countryData,
    `What is the capital of ${country}?`,
    capital,
    capitalDistractors(country)
  )),

  entry("video-games", "Pong", "Pong was one of the earliest commercially successful arcade video games.", SOURCES.gameHistory, "Which early arcade game simulated table tennis?", "Pong", ["Pac-Man", "Doom", "Tetris"]),
  entry("video-games", "Pac-Man", "Pac-Man was first released in Japan in 1980.", SOURCES.gameHistory, "In what decade was Pac-Man first released?", "1980s", ["1960s", "1990s", "2010s"]),
  entry("video-games", "Donkey Kong", "Donkey Kong introduced Mario under the name Jumpman.", SOURCES.gameHistory, "Which game introduced Mario as Jumpman?", "Donkey Kong", ["Sonic the Hedgehog", "Halo", "Street Fighter II"]),
  entry("video-games", "Super Mario Bros.", "Super Mario Bros. was released for the Nintendo Entertainment System in the 1980s.", SOURCES.gameHistory, "Which console family is closely tied to Super Mario Bros.?", "Nintendo Entertainment System", ["PlayStation 5", "Dreamcast", "Xbox Series X"]),
  entry("video-games", "The Legend of Zelda", "The Legend of Zelda series is known for exploration, puzzles, and the kingdom of Hyrule.", SOURCES.gameHistory, "Which fictional kingdom is central to many Zelda games?", "Hyrule", ["Rapture", "Midgar", "Skyrim"]),
  entry("video-games", "Tetris", "Tetris was created by Alexey Pajitnov.", SOURCES.gameHistory, "Who created Tetris?", "Alexey Pajitnov", ["Shigeru Miyamoto", "John Carmack", "Hideo Kojima"]),
  entry("video-games", "Sonic", "Sonic the Hedgehog became a major Sega mascot.", SOURCES.gameHistory, "Which company is closely associated with Sonic the Hedgehog?", "Sega", ["Nintendo", "Atari", "Valve"]),
  entry("video-games", "Doom", "Doom helped popularize first-person shooter games in the 1990s.", SOURCES.gameHistory, "Which genre did Doom help popularize?", "First-person shooter", ["City builder", "Visual novel", "Kart racing"]),
  entry("video-games", "Pokemon", "Pokemon Red and Green first launched in Japan for the Game Boy.", SOURCES.gameHistory, "Pokemon Red and Green first launched on which handheld system?", "Game Boy", ["Nintendo DS", "PlayStation Portable", "Game Gear"]),
  entry("video-games", "Minecraft", "Minecraft is known for block-based building and survival gameplay.", SOURCES.gameHistory, "Minecraft is best known for what kind of world-building?", "Block-based building", ["Rhythm dancing", "Pinball scoring", "Chess notation"]),
  entry("video-games", "Fortnite", "Fortnite Battle Royale helped popularize large-scale battle royale gameplay.", SOURCES.gameHistory, "Fortnite Battle Royale helped popularize which genre?", "Battle royale", ["Turn-based tactics", "Text adventure", "Roguelike deckbuilder"]),
  entry("video-games", "The Sims", "The Sims is a life-simulation video game series.", SOURCES.gameHistory, "What kind of simulation is The Sims known for?", "Life simulation", ["Flight simulation only", "Fishing simulation", "Train dispatching"]),
  entry("video-games", "World of Warcraft", "World of Warcraft is a massively multiplayer online role-playing game.", SOURCES.gameHistory, "World of Warcraft belongs to which broad genre?", "MMORPG", ["Puzzle platformer", "Kart racer", "Rail shooter"]),
  entry("video-games", "Halo", "Halo: Combat Evolved launched with the original Xbox.", SOURCES.gameHistory, "Which console launched with Halo: Combat Evolved?", "Original Xbox", ["Nintendo 64", "PlayStation 2", "Sega Saturn"]),
  entry("video-games", "Street Fighter II", "Street Fighter II helped define the modern fighting game genre.", SOURCES.gameHistory, "Street Fighter II is a landmark in which genre?", "Fighting games", ["Farming sims", "Sports management", "Hidden object games"]),
  entry("video-games", "Animal Crossing", "Animal Crossing is known for social simulation and village life.", SOURCES.gameHistory, "Animal Crossing is known for what style of play?", "Social simulation", ["Military shooter", "Trivia quiz", "Pinball arcade"]),
  entry("video-games", "Final Fantasy VII", "Final Fantasy VII popularized cinematic role-playing games on PlayStation.", SOURCES.gameHistory, "Final Fantasy VII is best described as what genre?", "Role-playing game", ["Soccer game", "Puzzle game", "Skateboarding game"]),
  entry("video-games", "Roblox", "Roblox is a platform where users can create and play experiences.", SOURCES.gameHistory, "Roblox is known for user-created what?", "Experiences", ["Satellites", "Currencies", "Operating systems"]),
  entry("video-games", "Portal", "Portal is known for puzzle solving with linked portals.", SOURCES.gameHistory, "Portal is known for puzzles using what?", "Linked portals", ["Card decks", "Race cars", "Drum pads"]),
  entry("video-games", "Among Us", "Among Us is a social deduction game about crewmates and impostors.", SOURCES.gameHistory, "Among Us is what kind of game?", "Social deduction", ["Flight simulator", "Golf game", "Tower defense only"]),

  entry("movies", "Citizen Kane", "Citizen Kane was directed by Orson Welles.", SOURCES.imdb, "Who directed Citizen Kane?", "Orson Welles", ["Alfred Hitchcock", "Steven Spielberg", "Akira Kurosawa"]),
  entry("movies", "The Wizard of Oz", "The Wizard of Oz was released in 1939.", SOURCES.imdb, "The Wizard of Oz was released in what year?", "1939", ["1927", "1955", "1977"]),
  entry("movies", "Star Wars", "Star Wars: A New Hope was released in 1977.", SOURCES.imdb, "Star Wars: A New Hope was released in what year?", "1977", ["1969", "1984", "1999"]),
  entry("movies", "Jaws", "Jaws was directed by Steven Spielberg.", SOURCES.imdb, "Who directed Jaws?", "Steven Spielberg", ["George Lucas", "James Cameron", "Ridley Scott"]),
  entry("movies", "Titanic", "Titanic was directed by James Cameron.", SOURCES.imdb, "Who directed Titanic?", "James Cameron", ["Peter Jackson", "Christopher Nolan", "Martin Scorsese"]),
  entry("movies", "Jurassic Park", "Jurassic Park was based on a novel by Michael Crichton.", SOURCES.imdb, "Jurassic Park was based on a novel by whom?", "Michael Crichton", ["Stephen King", "J. R. R. Tolkien", "Isaac Asimov"]),
  entry("movies", "The Godfather", "The Godfather was directed by Francis Ford Coppola.", SOURCES.imdb, "Who directed The Godfather?", "Francis Ford Coppola", ["Brian De Palma", "Quentin Tarantino", "David Lean"]),
  entry("movies", "Casablanca", "Casablanca stars Humphrey Bogart and Ingrid Bergman.", SOURCES.imdb, "Which actor starred in Casablanca?", "Humphrey Bogart", ["Tom Hanks", "Marlon Brando", "Cary Grant"]),
  entry("movies", "Black Panther", "Black Panther is set partly in the fictional nation of Wakanda.", SOURCES.imdb, "Black Panther is set partly in which fictional nation?", "Wakanda", ["Genovia", "Latveria", "Narnia"]),
  entry("movies", "Finding Nemo", "Finding Nemo is an animated film from Pixar.", SOURCES.imdb, "Finding Nemo was made by which animation studio?", "Pixar", ["Studio Ghibli", "DreamWorks only", "Aardman only"]),
  entry("movies", "Spirited Away", "Spirited Away was directed by Hayao Miyazaki.", SOURCES.imdb, "Who directed Spirited Away?", "Hayao Miyazaki", ["Satoshi Kon", "Makoto Shinkai", "Isao Takahata"]),
  entry("movies", "The Lord of the Rings", "The Lord of the Rings film trilogy was directed by Peter Jackson.", SOURCES.imdb, "Who directed The Lord of the Rings film trilogy?", "Peter Jackson", ["James Cameron", "George Miller", "Sam Raimi"]),
  entry("movies", "The Dark Knight", "The Dark Knight features Batman and the Joker.", SOURCES.imdb, "Which superhero appears in The Dark Knight?", "Batman", ["Spider-Man", "Superman", "Iron Man"]),
  entry("movies", "Toy Story", "Toy Story was Pixar's first feature-length film.", SOURCES.imdb, "Toy Story was the first feature-length film from which studio?", "Pixar", ["Disney Animation only", "Blue Sky", "Laika"]),
  entry("movies", "Avatar", "Avatar is set largely on the fictional moon Pandora.", SOURCES.imdb, "Avatar is set largely on which fictional moon?", "Pandora", ["Endor", "Europa", "Arrakis"]),
  entry("movies", "Parasite", "Parasite was directed by Bong Joon Ho.", SOURCES.imdb, "Who directed Parasite?", "Bong Joon Ho", ["Park Chan-wook", "Ang Lee", "Hirokazu Kore-eda"]),
  entry("movies", "Psycho", "Psycho was directed by Alfred Hitchcock.", SOURCES.imdb, "Who directed Psycho?", "Alfred Hitchcock", ["Orson Welles", "Billy Wilder", "Stanley Kubrick"]),
  entry("movies", "The Matrix", "The Matrix features a simulated reality called the Matrix.", SOURCES.imdb, "The Matrix centers on what kind of reality?", "Simulated reality", ["Underwater city", "Medieval kingdom", "Mars colony"]),
  entry("movies", "Frozen", "Frozen features the song Let It Go.", SOURCES.imdb, "Which movie features Let It Go?", "Frozen", ["Moana", "Tangled", "Encanto"]),
  entry("movies", "The Lion King", "The Lion King features the character Simba.", SOURCES.imdb, "Which character appears in The Lion King?", "Simba", ["Shrek", "Nemo", "Po"]),

  ...simpleFacts("animals", SOURCES.britannica, [
    ["Blue whale", "The blue whale is the largest animal known to have lived on Earth.", "What is the largest animal known to have lived on Earth?", "Blue whale", ["African elephant", "Giraffe", "Whale shark"]],
    ["African elephant", "The African elephant is the largest living land animal.", "What is the largest living land animal?", "African elephant", ["Moose", "Polar bear", "Hippopotamus"]],
    ["Cheetah", "The cheetah is the fastest land animal.", "What is the fastest land animal?", "Cheetah", ["Lion", "Horse", "Wolf"]],
    ["Giraffe", "The giraffe is the tallest living land animal.", "What is the tallest living land animal?", "Giraffe", ["Camel", "Elephant", "Bison"]],
    ["Emperor penguin", "The emperor penguin is the tallest living penguin species.", "What is the tallest living penguin species?", "Emperor penguin", ["King penguin", "Rockhopper penguin", "Adelie penguin"]],
    ["Komodo dragon", "The Komodo dragon is the largest living lizard.", "What is the largest living lizard?", "Komodo dragon", ["Iguana", "Gila monster", "Gecko"]],
    ["Ostrich", "The ostrich is the largest living bird.", "What is the largest living bird?", "Ostrich", ["Emu", "Condor", "Albatross"]],
    ["Monarch butterfly", "Monarch butterflies are known for long-distance migration in North America.", "Which butterfly is known for long-distance migration in North America?", "Monarch butterfly", ["Swallowtail", "Painted lady", "Blue morpho"]],
    ["Platypus", "The platypus is a mammal that lays eggs.", "Which mammal lays eggs?", "Platypus", ["Kangaroo", "Koala", "Dolphin"]],
    ["Kangaroo", "Kangaroos are marsupials native to Australia.", "Kangaroos are native to which country-continent?", "Australia", ["Brazil", "Kenya", "Canada"]],
    ["Polar bear", "Polar bears live in Arctic regions.", "Polar bears are associated with which region?", "Arctic", ["Antarctic only", "Sahara", "Amazon Basin"]],
    ["Giant panda", "Giant pandas are native to China.", "Giant pandas are native to which country?", "China", ["India", "Peru", "Egypt"]],
    ["Honeybee", "Honeybees are important pollinators.", "Honeybees are important what?", "Pollinators", ["Volcanoes", "Planets", "Minerals"]],
    ["Octopus", "Octopuses have eight arms.", "How many arms does an octopus have?", "Eight", ["Six", "Ten", "Twelve"]],
    ["Dolphin", "Dolphins are marine mammals.", "Dolphins are what kind of animals?", "Marine mammals", ["Reptiles", "Amphibians", "Insects"]],
    ["Bald eagle", "The bald eagle is the national bird of the United States.", "What is the national bird of the United States?", "Bald eagle", ["Turkey", "Raven", "Condor"]],
    ["Tiger", "The tiger is the largest living cat species.", "What is the largest living cat species?", "Tiger", ["Lion", "Jaguar", "Leopard"]],
    ["Koala", "Koalas mainly eat eucalyptus leaves.", "Koalas mainly eat what?", "Eucalyptus leaves", ["Bamboo", "Grass", "Fish"]],
    ["Sea turtle", "Sea turtles are reptiles that live in oceans.", "Sea turtles are what kind of animal?", "Reptiles", ["Birds", "Mammals", "Insects"]],
    ["Hummingbird", "Hummingbirds can hover in flight.", "Which bird is known for hovering in flight?", "Hummingbird", ["Penguin", "Ostrich", "Eagle"]]
  ]),

  ...simpleFacts("geography", SOURCES.britannica, [
    ["Pacific Ocean", "The Pacific Ocean is Earth's largest ocean basin.", "What is Earth's largest ocean basin?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]],
    ["Sahara", "The Sahara is the largest hot desert on Earth.", "What is Earth's largest hot desert?", "Sahara", ["Gobi", "Kalahari", "Mojave"]],
    ["Amazon Basin", "The Amazon Basin contains the world's largest tropical rainforest.", "What region contains the largest tropical rainforest?", "Amazon Basin", ["Congo Basin", "Borneo", "Daintree"]],
    ["Equator", "The equator is located at 0 degrees latitude.", "What latitude is the equator?", "0 degrees", ["90 degrees", "180 degrees", "23.5 degrees north"]],
    ["Prime Meridian", "The prime meridian is located at 0 degrees longitude.", "What longitude is the prime meridian?", "0 degrees", ["90 degrees east", "180 degrees", "45 degrees west"]],
    ["Antarctica", "Antarctica is Earth's southernmost continent.", "What is Earth's southernmost continent?", "Antarctica", ["Africa", "Australia", "South America"]],
    ["Africa", "Africa is the second-largest continent by land area.", "Which continent is second-largest by land area?", "Africa", ["Europe", "Australia", "Antarctica"]],
    ["Nile", "The Nile is one of the world's longest rivers.", "Which river is one of the world's longest?", "Nile", ["Thames", "Seine", "Tiber"]],
    ["Andes", "The Andes are the longest continental mountain range.", "What is the longest continental mountain range?", "Andes", ["Alps", "Rockies", "Himalayas"]],
    ["Himalayas", "The Himalayas include Mount Everest.", "Which mountain range includes Mount Everest?", "Himalayas", ["Andes", "Alps", "Urals"]],
    ["Great Barrier Reef", "The Great Barrier Reef is off the coast of Australia.", "The Great Barrier Reef is off which country?", "Australia", ["Mexico", "Spain", "Japan"]],
    ["Mediterranean Sea", "The Mediterranean Sea lies between Europe, Africa, and Asia.", "Which sea lies between Europe, Africa, and Asia?", "Mediterranean Sea", ["Baltic Sea", "Caribbean Sea", "Bering Sea"]],
    ["Greenland", "Greenland is the world's largest island that is not a continent.", "What is the largest island that is not a continent?", "Greenland", ["Madagascar", "Borneo", "Iceland"]],
    ["Iceland", "Iceland sits on the Mid-Atlantic Ridge.", "Which country sits on the Mid-Atlantic Ridge?", "Iceland", ["Ireland", "Italy", "India"]],
    ["Dead Sea", "The Dead Sea is a hypersaline lake.", "What is the Dead Sea?", "Hypersaline lake", ["Ocean trench", "Glacier", "Volcano"]],
    ["Ring of Fire", "The Pacific Ring of Fire is known for earthquakes and volcanoes.", "The Pacific Ring of Fire is known for what?", "Earthquakes and volcanoes", ["Sand dunes", "Coral bleaching only", "Tornado alleys"]],
    ["Mariana Trench", "The Mariana Trench is the deepest ocean trench.", "What is the deepest ocean trench?", "Mariana Trench", ["Java Trench", "Tonga Trench", "Puerto Rico Trench"]],
    ["Mount Everest", "Mount Everest is the highest mountain above sea level.", "What is the highest mountain above sea level?", "Mount Everest", ["K2", "Denali", "Aconcagua"]],
    ["Atacama", "The Atacama Desert is one of the driest nonpolar deserts.", "Which desert is one of the driest nonpolar deserts?", "Atacama", ["Sahara", "Gobi", "Sonoran"]],
    ["Lake Baikal", "Lake Baikal is the world's deepest freshwater lake.", "What is the world's deepest freshwater lake?", "Lake Baikal", ["Lake Superior", "Lake Victoria", "Lake Tahoe"]]
  ])
];

const EXTRA_CATEGORIES = {
  countries: [
    ["Canada", "Canada is in North America.", "Canada is on which continent?", "North America", ["Europe", "Africa", "Asia"]],
    ["Brazil", "Brazil is the largest country in South America by area.", "What is the largest country in South America by area?", "Brazil", ["Argentina", "Peru", "Chile"]],
    ["India", "India is the world's most populous country according to recent UN estimates.", "Which country is the world's most populous according to recent UN estimates?", "India", ["Canada", "Australia", "Norway"]],
    ["Japan", "Japan is an island country in East Asia.", "Japan is an island country in which region?", "East Asia", ["South America", "West Africa", "Northern Europe"]],
    ["Egypt", "Egypt is a transcontinental country linking Africa and Asia through Sinai.", "Egypt links Africa and Asia through what peninsula?", "Sinai", ["Iberian", "Korean", "Yucatan"]],
    ["Mexico", "Mexico borders the United States to the north.", "Mexico borders which country to the north?", "United States", ["Brazil", "Spain", "France"]],
    ["France", "France is a member of the European Union.", "France is a member of which union?", "European Union", ["African Union", "ASEAN", "Mercosur"]],
    ["Nigeria", "Nigeria is in West Africa.", "Nigeria is in which region of Africa?", "West Africa", ["North Africa", "Southern Africa", "East Africa"]],
    ["Australia", "Australia is both a country and a continent-sized landmass.", "Australia is both a country and what kind of landmass?", "Continent-sized landmass", ["Moon", "Archipelago only", "Peninsula only"]],
    ["South Korea", "South Korea is located on the Korean Peninsula.", "South Korea is located on which peninsula?", "Korean Peninsula", ["Arabian Peninsula", "Iberian Peninsula", "Malay Peninsula"]],
    ["Italy", "Italy's mainland is shaped like a boot.", "Which country is often described as boot-shaped?", "Italy", ["Norway", "Japan", "Peru"]],
    ["Spain", "Spain occupies most of the Iberian Peninsula with Portugal.", "Spain shares the Iberian Peninsula with which country?", "Portugal", ["Greece", "Poland", "Morocco"]],
    ["Kenya", "Kenya lies on the equator in East Africa.", "Kenya lies on which major latitude line?", "Equator", ["Prime Meridian", "Arctic Circle", "Tropic of Capricorn"]],
    ["Argentina", "Argentina is home to much of the Pampas grassland region.", "The Pampas are strongly associated with which country?", "Argentina", ["Iceland", "Thailand", "Egypt"]],
    ["Norway", "Norway is known for fjords along its coast.", "Norway is known for what coastal features?", "Fjords", ["Coral atolls", "Mangrove deltas", "Sand seas"]],
    ["China", "China is in East Asia.", "China is in which region?", "East Asia", ["West Europe", "South America", "North Africa"]],
    ["Germany", "Germany is a federal republic in Central Europe.", "Germany is a federal republic in which part of Europe?", "Central Europe", ["South America", "East Africa", "Oceania"]],
    ["Morocco", "Morocco is in North Africa.", "Morocco is in which region?", "North Africa", ["South Asia", "Central America", "Oceania"]],
    ["Peru", "Peru is home to Machu Picchu.", "Machu Picchu is in which country?", "Peru", ["Mexico", "India", "Greece"]],
    ["United Kingdom", "The United Kingdom consists of England, Scotland, Wales, and Northern Ireland.", "Which country is part of the United Kingdom?", "Scotland", ["Iceland", "Belgium", "Portugal"]]
  ],
  history: [
    ["Magna Carta", "Magna Carta was sealed in 1215.", "In what year was Magna Carta sealed?", "1215", ["1066", "1492", "1776"]],
    ["Declaration of Independence", "The U.S. Declaration of Independence was adopted on July 4, 1776.", "When was the U.S. Declaration of Independence adopted?", "July 4, 1776", ["July 14, 1789", "June 15, 1215", "May 8, 1945"]],
    ["French Revolution", "The Storming of the Bastille took place in 1789.", "The Storming of the Bastille took place in what year?", "1789", ["1776", "1815", "1914"]],
    ["World War I", "World War I began in 1914.", "In what year did World War I begin?", "1914", ["1918", "1939", "1945"]],
    ["World War II", "World War II ended in 1945.", "In what year did World War II end?", "1945", ["1918", "1939", "1969"]],
    ["Apollo 11", "Apollo 11 landed humans on the Moon in 1969.", "Which Apollo mission first landed humans on the Moon?", "Apollo 11", ["Apollo 8", "Apollo 13", "Gemini 4"]],
    ["Berlin Wall", "The Berlin Wall opened on November 9, 1989.", "In what year did the Berlin Wall open?", "1989", ["1945", "1961", "1991"]],
    ["United Nations", "The United Nations Charter entered into force in 1945.", "The UN Charter entered into force in what year?", "1945", ["1919", "1963", "1989"]],
    ["World Wide Web", "Tim Berners-Lee proposed the World Wide Web at CERN.", "Who proposed the World Wide Web at CERN?", "Tim Berners-Lee", ["Alan Turing", "Grace Hopper", "Vint Cerf"]],
    ["Printing press", "Johannes Gutenberg is closely associated with movable-type printing in Europe.", "Who is closely associated with movable-type printing in Europe?", "Johannes Gutenberg", ["Isaac Newton", "Galileo", "Copernicus"]],
    ["Renaissance", "The Renaissance began in Italy before spreading through Europe.", "The Renaissance began in which country?", "Italy", ["Canada", "Japan", "Brazil"]],
    ["Industrial Revolution", "The Industrial Revolution began in Britain.", "Where did the Industrial Revolution begin?", "Britain", ["Peru", "China", "Egypt"]],
    ["Cold War", "The Cold War followed World War II.", "The Cold War followed which major war?", "World War II", ["World War I", "Napoleonic Wars", "Crimean War"]],
    ["American Civil War", "The American Civil War began in 1861.", "In what year did the American Civil War begin?", "1861", ["1776", "1914", "1941"]],
    ["Mongol Empire", "The Mongol Empire was founded by Genghis Khan.", "Who founded the Mongol Empire?", "Genghis Khan", ["Kublai Khan", "Akbar", "Julius Caesar"]],
    ["Roman Empire", "Julius Caesar was assassinated in 44 BCE.", "Julius Caesar was assassinated in what year?", "44 BCE", ["1066", "1215", "1492"]],
    ["Columbus voyage", "Christopher Columbus reached the Caribbean in 1492.", "Columbus reached the Caribbean in what year?", "1492", ["1215", "1776", "1914"]],
    ["Meiji Restoration", "The Meiji Restoration began in Japan in 1868.", "The Meiji Restoration began in which country?", "Japan", ["China", "Korea", "Thailand"]],
    ["Russian Revolution", "The Russian Revolution took place in 1917.", "The Russian Revolution took place in what year?", "1917", ["1812", "1945", "1989"]],
    ["Nelson Mandela", "Nelson Mandela became president of South Africa in 1994.", "Nelson Mandela became president of South Africa in what year?", "1994", ["1963", "1989", "2008"]]
  ],
  space: [
    ["Mercury", "Mercury is the closest planet to the Sun.", "Which planet is closest to the Sun?", "Mercury", ["Venus", "Earth", "Mars"]],
    ["Venus", "Venus is the second planet from the Sun.", "Which planet is second from the Sun?", "Venus", ["Mercury", "Earth", "Mars"]],
    ["Earth", "Earth is the third planet from the Sun.", "Which planet is third from the Sun?", "Earth", ["Venus", "Mars", "Jupiter"]],
    ["Mars", "Mars is the fourth planet from the Sun.", "Which planet is fourth from the Sun?", "Mars", ["Earth", "Jupiter", "Saturn"]],
    ["Jupiter", "Jupiter is the largest planet in the solar system.", "What is the largest planet in the solar system?", "Jupiter", ["Saturn", "Neptune", "Earth"]],
    ["Saturn", "Saturn is known for its prominent ring system.", "Which planet is famous for prominent rings?", "Saturn", ["Mercury", "Mars", "Venus"]],
    ["Uranus", "Uranus is the seventh planet from the Sun.", "Which planet is seventh from the Sun?", "Uranus", ["Saturn", "Neptune", "Jupiter"]],
    ["Neptune", "Neptune is the eighth planet from the Sun.", "Which planet is eighth from the Sun?", "Neptune", ["Uranus", "Saturn", "Pluto"]],
    ["Milky Way", "Our solar system is in the Milky Way galaxy.", "Which galaxy contains our solar system?", "Milky Way", ["Andromeda", "Triangulum", "Whirlpool"]],
    ["Sun", "The Sun is a star.", "What type of object is the Sun?", "Star", ["Planet", "Comet", "Moon"]],
    ["Moon", "The Moon is Earth's natural satellite.", "What is Earth's natural satellite?", "Moon", ["Mars", "Venus", "Europa"]],
    ["Asteroid belt", "The main asteroid belt lies between Mars and Jupiter.", "The main asteroid belt lies between which planets?", "Mars and Jupiter", ["Earth and Mars", "Venus and Earth", "Saturn and Uranus"]],
    ["Comet", "Comets are icy small bodies that can develop tails near the Sun.", "Comets are mainly known as what kind of small bodies?", "Icy", ["Metal-only", "Gas giant", "Artificial"]],
    ["Apollo 11", "Apollo 11 was the first crewed mission to land on the Moon.", "Which mission first landed humans on the Moon?", "Apollo 11", ["Apollo 7", "Apollo 13", "Gemini 12"]],
    ["Hubble", "The Hubble Space Telescope observes the universe from Earth orbit.", "The Hubble Space Telescope observes from where?", "Earth orbit", ["The ocean floor", "Mars surface", "Venus atmosphere"]],
    ["ISS", "The International Space Station orbits Earth.", "What does the International Space Station orbit?", "Earth", ["Mars", "Jupiter", "The Moon only"]],
    ["Olympus Mons", "Olympus Mons is a giant volcano on Mars.", "Olympus Mons is on which planet?", "Mars", ["Earth", "Venus", "Mercury"]],
    ["Europa", "Europa is a moon of Jupiter.", "Europa is a moon of which planet?", "Jupiter", ["Saturn", "Mars", "Neptune"]],
    ["Titan", "Titan is Saturn's largest moon.", "Titan is the largest moon of which planet?", "Saturn", ["Jupiter", "Uranus", "Earth"]],
    ["Pluto", "Pluto is classified as a dwarf planet.", "Pluto is classified as what?", "Dwarf planet", ["Gas giant", "Star", "Galaxy"]]
  ],
  governments: [
    ["United Nations", "The United Nations has 193 Member States.", "How many Member States does the United Nations have?", "193", ["195", "200", "181"]],
    ["Security Council", "The UN Security Council has five permanent members.", "How many permanent members are on the UN Security Council?", "Five", ["Three", "Ten", "Fifteen"]],
    ["United States", "The U.S. federal government has legislative, executive, and judicial branches.", "How many branches does the U.S. federal government have?", "Three", ["Two", "Four", "Five"]],
    ["United Kingdom", "The UK Parliament includes the Crown, the House of Commons, and the House of Lords.", "Which chamber is part of the UK Parliament?", "House of Commons", ["Bundestag", "National Diet", "Lok Sabha"]],
    ["Japan", "Japan's national legislature is the National Diet.", "What is Japan's national legislature called?", "National Diet", ["Congress", "Bundestag", "Knesset"]],
    ["Germany", "Germany's federal parliament includes the Bundestag.", "Germany's directly elected federal chamber is called what?", "Bundestag", ["House of Lords", "Senate of Canada", "National Assembly of France"]],
    ["India", "India's Parliament includes the Lok Sabha and Rajya Sabha.", "Which house is part of India's Parliament?", "Lok Sabha", ["Bundestag", "House of Lords", "Duma only"]],
    ["Australia", "Australia is a federal parliamentary constitutional monarchy.", "Australia is a federal parliamentary what?", "Constitutional monarchy", ["Absolute monarchy", "City-state", "One-party republic only"]],
    ["France", "France has a semi-presidential republic system.", "France is commonly described as what kind of republic?", "Semi-presidential", ["Absolute monarchy", "Theocracy only", "City-state"]],
    ["Canada", "Canada is a federal parliamentary constitutional monarchy.", "Canada is a federal parliamentary what?", "Constitutional monarchy", ["Empire only", "Military junta", "City-state"]],
    ["Brazil", "Brazil is a federal presidential republic.", "Brazil is what kind of republic?", "Federal presidential", ["Absolute monarchy", "Confederation only", "City-state"]],
    ["Mexico", "Mexico is a federal republic.", "Mexico is what kind of republic?", "Federal republic", ["Absolute monarchy", "City-state", "Theocracy only"]],
    ["European Union", "The European Parliament is directly elected by EU citizens.", "The European Parliament is elected by whom?", "EU citizens", ["UN ambassadors", "Only monarchs", "NASA staff"]],
    ["Constitution", "A constitution sets basic rules for a government.", "What sets basic rules for a government?", "Constitution", ["Weather map", "Tax receipt", "Passport only"]],
    ["Federalism", "Federalism divides power between national and regional governments.", "Federalism divides power between national and what governments?", "Regional", ["Oceanic", "Astronomical", "Corporate only"]],
    ["Parliament", "A parliament is a legislative body.", "A parliament is what kind of body?", "Legislative", ["Judicial only", "Meteorological", "Musical"]],
    ["Cabinet", "A cabinet is a group of senior government ministers or advisers.", "A cabinet is a group of senior government what?", "Ministers or advisers", ["Astronauts", "Athletes", "Composers"]],
    ["Election", "An election is a formal process for choosing public officials.", "An election is used to choose what?", "Public officials", ["Ocean tides", "Planet orbits", "Mountain heights"]],
    ["Referendum", "A referendum is a direct vote by the electorate on a proposal.", "A referendum is what kind of vote?", "Direct vote", ["Secret treaty", "Court building", "Weather event"]],
    ["Supreme court", "A supreme court is usually the highest court in a judicial system.", "A supreme court is usually the highest what?", "Court", ["River", "Mountain", "Currency"]]
  ],
  money: [
    ["U.S. dollar", "The ISO 4217 code for the U.S. dollar is USD.", "What is the ISO code for the U.S. dollar?", "USD", ["EUR", "JPY", "GBP"]],
    ["Euro", "The ISO 4217 code for the euro is EUR.", "What is the ISO code for the euro?", "EUR", ["USD", "JPY", "CAD"]],
    ["Japanese yen", "The ISO 4217 code for the Japanese yen is JPY.", "What is the ISO code for the Japanese yen?", "JPY", ["CNY", "KRW", "EUR"]],
    ["Pound sterling", "The ISO 4217 code for pound sterling is GBP.", "What is the ISO code for pound sterling?", "GBP", ["USD", "EUR", "AUD"]],
    ["Canadian dollar", "The ISO 4217 code for the Canadian dollar is CAD.", "What is the ISO code for the Canadian dollar?", "CAD", ["USD", "AUD", "CHF"]],
    ["Indian rupee", "The ISO 4217 code for the Indian rupee is INR.", "What is the ISO code for the Indian rupee?", "INR", ["IDR", "JPY", "CNY"]],
    ["Chinese yuan", "The ISO 4217 code for the Chinese yuan renminbi is CNY.", "What is the ISO code for the Chinese yuan?", "CNY", ["JPY", "KRW", "INR"]],
    ["Swiss franc", "The ISO 4217 code for the Swiss franc is CHF.", "What is the ISO code for the Swiss franc?", "CHF", ["CAD", "CNY", "SEK"]],
    ["Australian dollar", "The ISO 4217 code for the Australian dollar is AUD.", "What is the ISO code for the Australian dollar?", "AUD", ["CAD", "USD", "NZD only"]],
    ["New Zealand dollar", "The ISO 4217 code for the New Zealand dollar is NZD.", "What is the ISO code for the New Zealand dollar?", "NZD", ["AUD", "CAD", "USD"]],
    ["World Bank GDP", "The World Bank publishes GDP in current U.S. dollars under indicator NY.GDP.MKTP.CD.", "What is the World Bank code for GDP in current U.S. dollars?", "NY.GDP.MKTP.CD", ["SP.POP.TOTL", "EN.ATM.CO2E.KT", "FP.CPI.TOTL.ZG"]],
    ["Federal Reserve", "The Federal Reserve is the central bank of the United States.", "What is the central bank of the United States?", "Federal Reserve", ["World Bank", "IMF", "European Central Bank"]],
    ["European Central Bank", "The European Central Bank is the central bank for the euro.", "What is the central bank for the euro?", "European Central Bank", ["Federal Reserve", "Bank of Japan", "World Bank"]],
    ["Banknote", "A banknote is paper money issued by an authority.", "A banknote is what kind of money?", "Paper money", ["Digital password", "Credit score", "Bond only"]],
    ["Coin", "A coin is money made from metal or metal-like material.", "A coin is usually made from what?", "Metal or metal-like material", ["Paper only", "Wood only", "Glass only"]],
    ["Inflation", "Inflation is a general rise in prices over time.", "Inflation is a general rise in what?", "Prices", ["Latitude", "Rainfall only", "Mountain height"]],
    ["Exchange rate", "An exchange rate compares the value of one currency with another.", "An exchange rate compares what?", "Currencies", ["Planets", "Animals", "Languages only"]],
    ["Budget", "A budget is a plan for income and spending.", "A budget plans income and what?", "Spending", ["Weather", "Moon phases", "Tree rings"]],
    ["Interest", "Interest is money paid for borrowing or saving money.", "Interest is money paid for borrowing or what?", "Saving money", ["Growing rice", "Painting", "Sailing only"]],
    ["Tax", "A tax is a required payment collected by a government.", "A tax is collected by what?", "Government", ["Comet", "Mountain", "Ocean current"]]
  ],
  "world-records": [
    ["Everest", "Mount Everest is the highest mountain above sea level.", "What is the highest mountain above sea level?", "Mount Everest", ["K2", "Denali", "Aconcagua"]],
    ["Mauna Kea", "Mauna Kea is the tallest mountain from base to peak.", "Which mountain is tallest from base to peak?", "Mauna Kea", ["Everest", "K2", "Elbrus"]],
    ["Mariana Trench", "The Mariana Trench is the deepest known ocean trench.", "What is the deepest known ocean trench?", "Mariana Trench", ["Java Trench", "Puerto Rico Trench", "Tonga Trench"]],
    ["Pacific Ocean", "The Pacific Ocean is Earth's largest ocean basin.", "What is Earth's largest ocean basin?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]],
    ["Blue whale", "The blue whale is the largest animal known to have lived on Earth.", "What is the largest animal known to have lived on Earth?", "Blue whale", ["African elephant", "Giraffe", "Whale shark"]],
    ["African elephant", "The African elephant is the largest living land animal.", "What is the largest living land animal?", "African elephant", ["Moose", "Polar bear", "Hippopotamus"]],
    ["Ostrich", "The ostrich is the largest living bird.", "What is the largest living bird?", "Ostrich", ["Emu", "Condor", "Albatross"]],
    ["Komodo dragon", "The Komodo dragon is the largest living lizard.", "What is the largest living lizard?", "Komodo dragon", ["Iguana", "Gecko", "Gila monster"]],
    ["Jupiter", "Jupiter is the largest planet in the solar system.", "What is the largest planet in the solar system?", "Jupiter", ["Saturn", "Neptune", "Earth"]],
    ["Ganymede", "Ganymede is the largest moon in the solar system.", "What is the largest moon in the solar system?", "Ganymede", ["Titan", "Europa", "The Moon"]],
    ["Sahara", "The Sahara is the largest hot desert on Earth.", "What is Earth's largest hot desert?", "Sahara", ["Gobi", "Kalahari", "Mojave"]],
    ["Greenland", "Greenland is the largest island that is not a continent.", "What is the largest island that is not a continent?", "Greenland", ["Madagascar", "Borneo", "Iceland"]],
    ["Lake Baikal", "Lake Baikal is the world's deepest freshwater lake.", "What is the world's deepest freshwater lake?", "Lake Baikal", ["Lake Superior", "Lake Victoria", "Lake Tahoe"]],
    ["Nile", "The Nile is one of the world's longest rivers.", "Which river is one of the world's longest?", "Nile", ["Thames", "Seine", "Tiber"]],
    ["Andes", "The Andes are the longest continental mountain range.", "What is the longest continental mountain range?", "Andes", ["Alps", "Rockies", "Himalayas"]],
    ["Amazon rainforest", "The Amazon is the world's largest tropical rainforest.", "What is the world's largest tropical rainforest?", "Amazon", ["Congo", "Daintree", "Tongass"]],
    ["Vatican City", "Vatican City is the smallest country by area.", "What is the smallest country by area?", "Vatican City", ["Monaco", "San Marino", "Liechtenstein"]],
    ["Russia", "Russia is the largest country by area.", "What is the largest country by area?", "Russia", ["Canada", "China", "United States"]],
    ["Antarctica", "Antarctica is the coldest continent.", "What is the coldest continent?", "Antarctica", ["Europe", "Africa", "Australia"]],
    ["Burj Khalifa", "The Burj Khalifa is the world's tallest building.", "What is the world's tallest building?", "Burj Khalifa", ["Empire State Building", "Shanghai Tower", "Taipei 101"]]
  ]
};

Object.entries(EXTRA_CATEGORIES).forEach(([category, facts]) => {
  RAW_FACTS.push(...simpleFacts(category, SOURCES.britannica, facts));
});

const CATEGORY_BANKS = {
  plants: [
    ["Giant sequoia", "Giant sequoias are among the largest trees by volume.", "Which trees are among the largest by volume?", "Giant sequoias", ["Mangroves", "Banyans", "Palm trees"]],
    ["Photosynthesis", "Photosynthesis lets plants use light energy to make sugars.", "What process lets plants use light energy to make sugars?", "Photosynthesis", ["Respiration", "Fermentation", "Condensation"]],
    ["Bamboo", "Bamboo belongs to the grass family.", "Bamboo belongs to what plant family type?", "Grass", ["Fern", "Moss", "Conifer"]],
    ["Saguaro", "The saguaro cactus is native to the Sonoran Desert.", "The saguaro cactus is native to which desert?", "Sonoran Desert", ["Sahara", "Gobi", "Atacama"]],
    ["Venus flytrap", "The Venus flytrap is a carnivorous plant.", "The Venus flytrap is what kind of plant?", "Carnivorous", ["Aquatic only", "Parasitic mushroom", "Tree fern"]],
    ["Sunflower", "Sunflowers are known for large flower heads with many tiny florets.", "Sunflowers are known for large what?", "Flower heads", ["Cones", "Needles", "Spores only"]],
    ["Oak", "Oak trees produce acorns.", "Oak trees produce what?", "Acorns", ["Pineapples", "Coconuts", "Olives"]],
    ["Maple", "Maple trees can produce sap used to make maple syrup.", "Maple syrup comes from what tree product?", "Sap", ["Bark dust", "Seeds only", "Flowers only"]],
    ["Moss", "Mosses are non-flowering plants that reproduce with spores.", "Mosses reproduce with what?", "Spores", ["Acorns", "Cones only", "Fruit pits"]],
    ["Fern", "Ferns reproduce by spores rather than seeds.", "Ferns reproduce by what?", "Spores", ["Nuts", "Berries", "Bulbs only"]],
    ["Pine", "Pine trees are conifers.", "Pine trees are what kind of plant?", "Conifers", ["Grasses", "Mosses", "Cacti only"]],
    ["Coconut palm", "Coconut palms produce coconuts.", "What tree produces coconuts?", "Coconut palm", ["Oak", "Maple", "Spruce"]],
    ["Banana", "Banana plants are large herbs rather than woody trees.", "Banana plants are best described as large what?", "Herbs", ["Conifers", "Mosses", "Cacti"]],
    ["Wheat", "Wheat is a cereal grain.", "Wheat is what type of crop?", "Cereal grain", ["Root vegetable", "Tree nut", "Seaweed"]],
    ["Rice", "Rice is a major staple grain.", "Rice is a major staple what?", "Grain", ["Nut", "Mushroom", "Berry only"]],
    ["Tulip", "Tulips grow from bulbs.", "Tulips grow from what?", "Bulbs", ["Acorns", "Spores", "Cones"]],
    ["Rose", "Roses are flowering plants in the genus Rosa.", "Roses belong to which genus?", "Rosa", ["Quercus", "Acer", "Pinus"]],
    ["Baobab", "Baobab trees are known for thick trunks that store water.", "Baobabs are known for thick trunks that store what?", "Water", ["Oil", "Salt", "Sand"]],
    ["Mangrove", "Mangroves grow in coastal saline environments.", "Mangroves often grow in what kind of environment?", "Coastal saline", ["High alpine", "Deep desert only", "Polar ice"]],
    ["Redwood", "Coast redwoods are among the tallest trees on Earth.", "Which trees are among the tallest on Earth?", "Coast redwoods", ["Apple trees", "Olive trees", "Banana plants"]]
  ],
  oceans: [
    ["Pacific Ocean", "The Pacific Ocean is Earth's largest ocean basin.", "What is Earth's largest ocean basin?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]],
    ["Atlantic Ocean", "The Atlantic Ocean separates the Americas from Europe and Africa.", "Which ocean separates the Americas from Europe and Africa?", "Atlantic Ocean", ["Indian Ocean", "Arctic Ocean", "Southern Ocean"]],
    ["Indian Ocean", "The Indian Ocean is bordered by Africa, Asia, Australia, and the Southern Ocean.", "Which ocean is bordered by Africa, Asia, and Australia?", "Indian Ocean", ["Pacific Ocean", "Arctic Ocean", "Atlantic Ocean"]],
    ["Arctic Ocean", "The Arctic Ocean is the smallest ocean by area.", "What is the smallest ocean by area?", "Arctic Ocean", ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean"]],
    ["Southern Ocean", "The Southern Ocean surrounds Antarctica.", "Which ocean surrounds Antarctica?", "Southern Ocean", ["Indian Ocean", "Arctic Ocean", "Atlantic Ocean"]],
    ["Tides", "The Moon is the main driver of Earth's ocean tides.", "What is the main driver of Earth's ocean tides?", "The Moon", ["Mars", "Clouds", "Volcanoes"]],
    ["Coral reefs", "Coral reefs are built by colonies of coral polyps.", "What animals build coral reefs?", "Coral polyps", ["Krill", "Clams", "Sea stars"]],
    ["Salinity", "Ocean water is salty because it contains dissolved salts.", "Why is ocean water salty?", "Dissolved salts", ["Dissolved sugar", "No minerals", "Pure oxygen"]],
    ["Kelp forests", "Kelp forests are underwater ecosystems formed by large brown algae.", "Kelp forests are formed by large what?", "Brown algae", ["Corals", "Sponges", "Sea turtles"]],
    ["Mariana Trench", "The Mariana Trench is the deepest known ocean trench.", "What is the deepest known ocean trench?", "Mariana Trench", ["Java Trench", "Puerto Rico Trench", "Peru-Chile Trench"]],
    ["Gulf Stream", "The Gulf Stream is a warm Atlantic Ocean current.", "The Gulf Stream is what kind of current?", "Warm Atlantic current", ["Cold Pacific current", "River", "Tide pool"]],
    ["Phytoplankton", "Phytoplankton are microscopic photosynthetic organisms in water.", "What are phytoplankton?", "Microscopic photosynthetic organisms", ["Deep-sea rocks", "Large whales", "Frozen tides"]],
    ["Estuary", "An estuary is where freshwater and saltwater mix.", "What mixes in an estuary?", "Freshwater and saltwater", ["Lava and ice", "Sand and snow", "Oil and quartz"]],
    ["Abyssal plain", "Abyssal plains are flat regions of the deep ocean floor.", "Abyssal plains are found on the deep ocean what?", "Floor", ["Surface", "Cloud layer", "Shoreline only"]],
    ["Continental shelf", "A continental shelf is the submerged edge of a continent.", "A continental shelf is the submerged edge of what?", "Continent", ["Moon", "Volcano only", "River"]],
    ["Sea ice", "Sea ice is frozen ocean water.", "Sea ice is frozen what?", "Ocean water", ["Fresh lava", "Desert sand", "Tree sap"]],
    ["Tsunami", "A tsunami is a series of large waves often caused by undersea earthquakes.", "Tsunamis are often caused by undersea what?", "Earthquakes", ["Rainbows", "Droughts", "Clouds"]],
    ["Upwelling", "Upwelling brings deeper, nutrient-rich water toward the surface.", "Upwelling brings what toward the surface?", "Nutrient-rich water", ["Dry sand", "Fresh snow", "Magma only"]],
    ["Sargasso Sea", "The Sargasso Sea is a region of the North Atlantic Ocean.", "The Sargasso Sea is in which ocean?", "North Atlantic Ocean", ["Indian Ocean", "Arctic Ocean", "Southern Ocean"]],
    ["Ocean gyres", "Ocean gyres are large systems of circulating ocean currents.", "Ocean gyres are systems of circulating what?", "Ocean currents", ["Mountain ranges", "Volcano chains", "River deltas"]]
  ],
  climate: [
    ["Weather", "Weather describes short-term atmospheric conditions.", "What does weather describe?", "Short-term atmospheric conditions", ["Plate movement", "Moon phases", "Ocean depth only"]],
    ["Climate", "Climate describes average weather patterns over longer periods.", "What does climate describe?", "Average weather patterns", ["One storm", "One afternoon", "One volcano only"]],
    ["Greenhouse effect", "The greenhouse effect helps keep Earth warmer than it would be without greenhouse gases.", "The greenhouse effect helps keep Earth what?", "Warmer", ["Smaller", "Moonless", "Without oceans"]],
    ["Carbon dioxide", "Carbon dioxide is a greenhouse gas.", "Carbon dioxide is what kind of gas?", "Greenhouse gas", ["Noble gas only", "Metal vapor", "Liquid fuel"]],
    ["Methane", "Methane is a greenhouse gas.", "Methane is what kind of gas?", "Greenhouse gas", ["Noble gas", "Solid metal", "Salt"]],
    ["Water vapor", "Water vapor is a greenhouse gas in Earth's atmosphere.", "Water vapor in the atmosphere is what kind of gas?", "Greenhouse gas", ["Metal gas", "No gas", "Rock vapor"]],
    ["Albedo", "Albedo measures how much light a surface reflects.", "What does albedo measure?", "Reflectivity", ["Wind speed", "Ocean depth", "Soil age"]],
    ["Drought", "A drought is a prolonged period of unusually low water availability.", "What is a drought?", "Low water availability", ["High tide only", "Solar eclipse", "Volcano eruption"]],
    ["Monsoon", "A monsoon is a seasonal wind pattern that can bring heavy rain.", "A monsoon is a seasonal what?", "Wind pattern", ["Earthquake", "Glacier", "Meteor shower"]],
    ["El Nino", "El Nino is a climate pattern involving unusually warm surface waters in the tropical Pacific.", "El Nino involves unusually warm waters in which ocean?", "Pacific", ["Arctic", "Atlantic only", "Southern only"]],
    ["La Nina", "La Nina is linked with cooler-than-average surface waters in the central and eastern tropical Pacific.", "La Nina is linked with cooler surface waters in which ocean?", "Pacific", ["Indian", "Arctic", "Atlantic only"]],
    ["Hurricane", "A hurricane is a type of tropical cyclone.", "A hurricane is a type of what?", "Tropical cyclone", ["Glacier", "Earthquake", "Tornado only"]],
    ["Tornado", "A tornado is a rotating column of air in contact with the ground.", "A tornado is a rotating column of what?", "Air", ["Water", "Stone", "Lava"]],
    ["Jet stream", "Jet streams are fast-moving air currents high in the atmosphere.", "Jet streams are fast-moving currents of what?", "Air", ["Ocean water", "Magma", "Sand"]],
    ["Humidity", "Humidity is the amount of water vapor in the air.", "Humidity measures water vapor in what?", "Air", ["Rock", "Wood", "Metal"]],
    ["Barometer", "A barometer measures atmospheric pressure.", "What does a barometer measure?", "Atmospheric pressure", ["Temperature only", "Rain color", "Ocean salt"]],
    ["Anemometer", "An anemometer measures wind speed.", "What does an anemometer measure?", "Wind speed", ["Cloud height", "Soil moisture", "River length"]],
    ["Thermometer", "A thermometer measures temperature.", "What does a thermometer measure?", "Temperature", ["Pressure", "Distance", "Brightness only"]],
    ["Rain gauge", "A rain gauge measures precipitation.", "What does a rain gauge measure?", "Precipitation", ["Wind", "Latitude", "Earthquakes"]],
    ["Climate zone", "Tropical climates are generally found near the equator.", "Tropical climates are generally found near what?", "Equator", ["North Pole", "Prime Meridian only", "Deep ocean trenches"]]
  ],
  inventions: [
    ["Telephone", "Alexander Graham Bell received a U.S. patent for the telephone in 1876.", "Who received a U.S. patent for the telephone in 1876?", "Alexander Graham Bell", ["Thomas Edison", "Nikola Tesla", "Guglielmo Marconi"]],
    ["Airplane", "The Wright brothers made a famous powered flight in 1903.", "Who made a famous powered flight in 1903?", "Wright brothers", ["Bell brothers", "Montgolfier brothers", "Warner brothers"]],
    ["World Wide Web", "Tim Berners-Lee proposed the World Wide Web at CERN.", "Who proposed the World Wide Web?", "Tim Berners-Lee", ["Alan Turing", "Ada Lovelace", "Steve Wozniak"]],
    ["Light bulb", "Thomas Edison is associated with developing a practical incandescent light bulb.", "Who is associated with a practical incandescent light bulb?", "Thomas Edison", ["James Watt", "Samuel Morse", "Galileo"]],
    ["Printing press", "Johannes Gutenberg is associated with movable-type printing in Europe.", "Who is associated with movable-type printing in Europe?", "Johannes Gutenberg", ["Isaac Newton", "Louis Pasteur", "James Clerk Maxwell"]],
    ["Radio", "Guglielmo Marconi is associated with early radio communication.", "Who is associated with early radio communication?", "Guglielmo Marconi", ["Michelangelo", "Wright brothers", "Marie Curie"]],
    ["Steam engine", "James Watt improved the steam engine in the 18th century.", "Who improved the steam engine in the 18th century?", "James Watt", ["Charles Darwin", "Alexander Fleming", "Ada Lovelace"]],
    ["Penicillin", "Alexander Fleming discovered penicillin.", "Who discovered penicillin?", "Alexander Fleming", ["Louis Pasteur", "Marie Curie", "Rosalind Franklin"]],
    ["Dynamite", "Alfred Nobel invented dynamite.", "Who invented dynamite?", "Alfred Nobel", ["Nikola Tesla", "Robert Fulton", "Eli Whitney"]],
    ["Cotton gin", "Eli Whitney is associated with the cotton gin.", "Who is associated with the cotton gin?", "Eli Whitney", ["Henry Ford", "Thomas Edison", "James Watt"]],
    ["Morse code", "Samuel Morse helped develop Morse code.", "Who helped develop Morse code?", "Samuel Morse", ["Alexander Fleming", "Niels Bohr", "Leonardo da Vinci"]],
    ["Mechanical computer", "Charles Babbage designed early mechanical computing machines.", "Who designed early mechanical computing machines?", "Charles Babbage", ["Galileo", "Henry Ford", "Gutenberg"]],
    ["Computer programming", "Ada Lovelace is often described as an early computer programmer.", "Who is often described as an early computer programmer?", "Ada Lovelace", ["Marie Antoinette", "Jane Austen", "Florence Nightingale"]],
    ["Vaccination", "Edward Jenner pioneered smallpox vaccination.", "Who pioneered smallpox vaccination?", "Edward Jenner", ["James Watt", "Albert Einstein", "Nikola Tesla"]],
    ["Pasteurization", "Louis Pasteur developed pasteurization.", "Who developed pasteurization?", "Louis Pasteur", ["Alexander Graham Bell", "Alfred Nobel", "George Washington Carver"]],
    ["Model T", "Henry Ford's Model T made automobiles more affordable for many buyers.", "Whose Model T made automobiles more affordable?", "Henry Ford", ["Eli Whitney", "Samuel Morse", "Orville Wright"]],
    ["Printing", "Movable type helped books spread more widely.", "Movable type helped what spread more widely?", "Books", ["Planets", "Glaciers", "Volcanoes"]],
    ["Compass", "The magnetic compass helps with navigation.", "What does a magnetic compass help with?", "Navigation", ["Cooking", "Weaving", "Measuring sound"]],
    ["Telescope", "The telescope makes distant objects appear closer.", "What instrument makes distant objects appear closer?", "Telescope", ["Microscope", "Barometer", "Thermometer"]],
    ["Microscope", "The microscope makes very small objects easier to see.", "What instrument makes very small objects easier to see?", "Microscope", ["Telescope", "Compass", "Sundial"]]
  ],
  "arts-culture": [
    ["Mona Lisa", "The Mona Lisa was painted by Leonardo da Vinci.", "Who painted the Mona Lisa?", "Leonardo da Vinci", ["Michelangelo", "Raphael", "Claude Monet"]],
    ["Starry Night", "The Starry Night was painted by Vincent van Gogh.", "Who painted The Starry Night?", "Vincent van Gogh", ["Pablo Picasso", "Rembrandt", "Georgia O'Keeffe"]],
    ["Hamlet", "Hamlet was written by William Shakespeare.", "Who wrote Hamlet?", "William Shakespeare", ["Charles Dickens", "Mark Twain", "Jane Austen"]],
    ["Beethoven", "Ludwig van Beethoven composed nine numbered symphonies.", "How many numbered symphonies did Beethoven compose?", "Nine", ["Five", "Seven", "Twelve"]],
    ["Ballet", "Ballet developed as a formal dance tradition in Europe.", "Ballet is what kind of art?", "Dance", ["Painting only", "Architecture only", "Cartography"]],
    ["Origami", "Origami is the art of paper folding.", "Origami is the art of folding what?", "Paper", ["Glass", "Metal", "Clay"]],
    ["Calligraphy", "Calligraphy is decorative handwriting or lettering.", "Calligraphy is decorative what?", "Handwriting or lettering", ["Cooking", "Sculpture only", "Weaving only"]],
    ["Haiku", "A traditional haiku has three lines.", "A traditional haiku has how many lines?", "Three", ["Two", "Four", "Ten"]],
    ["Opera", "Opera combines music and theater.", "Opera combines music and what?", "Theater", ["Cartography", "Astronomy", "Meteorology"]],
    ["Jazz", "Jazz developed in the United States.", "Jazz developed in which country?", "United States", ["Norway", "Peru", "Thailand"]],
    ["The Louvre", "The Louvre is a major art museum in Paris.", "The Louvre is in which city?", "Paris", ["Rome", "Madrid", "Berlin"]],
    ["Broadway", "Broadway is associated with theater in New York City.", "Broadway is associated with theater in which city?", "New York City", ["Chicago", "London", "Toronto"]],
    ["Sculpture", "Sculpture is a three-dimensional visual art form.", "Sculpture is generally how many-dimensional?", "Three-dimensional", ["One-dimensional", "Only digital", "Only musical"]],
    ["Mural", "A mural is artwork painted or applied directly on a wall or ceiling.", "A mural is usually applied to what?", "Wall or ceiling", ["Ocean floor", "Cloud", "River"]],
    ["Tapestry", "A tapestry is a woven textile art form.", "A tapestry is what kind of art form?", "Woven textile", ["Metal casting", "Film editing", "Songwriting only"]],
    ["Kabuki", "Kabuki is a traditional Japanese theater form.", "Kabuki is traditional theater from which country?", "Japan", ["Brazil", "Egypt", "Canada"]],
    ["Flamenco", "Flamenco is associated with Spain.", "Flamenco is associated with which country?", "Spain", ["Finland", "India", "Morocco"]],
    ["Samba", "Samba is strongly associated with Brazil.", "Samba is strongly associated with which country?", "Brazil", ["Iceland", "China", "Greece"]],
    ["Pottery", "Pottery is made from shaped and fired clay.", "Pottery is made from what material?", "Clay", ["Ice", "Paper only", "Quartz only"]],
    ["Photography", "Photography creates images using light.", "Photography creates images using what?", "Light", ["Sound only", "Gravity", "Magnetism only"]]
  ],
  sports: [
    ["Olympics", "The modern Olympic Games began in Athens in 1896.", "Where did the modern Olympic Games begin in 1896?", "Athens", ["Paris", "London", "Rome"]],
    ["Soccer", "A standard outdoor soccer team has 11 players on the field.", "How many players are on one standard outdoor soccer team?", "11", ["9", "10", "12"]],
    ["Basketball", "Basketball was invented by James Naismith.", "Who invented basketball?", "James Naismith", ["Babe Ruth", "Michael Jordan", "Abner Doubleday"]],
    ["Tennis", "Tennis has four Grand Slam tournaments.", "How many tennis Grand Slam tournaments are there?", "Four", ["Two", "Three", "Six"]],
    ["Baseball", "A regulation baseball team fields nine players.", "How many players does a baseball team field?", "Nine", ["Seven", "Eight", "Eleven"]],
    ["Cricket", "Cricket teams traditionally have eleven players.", "How many players are on a cricket team?", "Eleven", ["Nine", "Ten", "Twelve"]],
    ["Rugby union", "A rugby union team has fifteen players on the field.", "How many players are on a rugby union team?", "Fifteen", ["Eleven", "Thirteen", "Seven"]],
    ["Golf", "A standard round of golf has 18 holes.", "How many holes are in a standard round of golf?", "18", ["9", "12", "20"]],
    ["Marathon", "A marathon is 26.2 miles or 42.195 kilometers.", "How long is a marathon in miles?", "26.2", ["13.1", "10", "50"]],
    ["Swimming", "Freestyle is a common competitive swimming stroke category.", "Freestyle is a category in which sport?", "Swimming", ["Tennis", "Baseball", "Archery"]],
    ["Fencing", "Fencing uses weapons such as foil, epee, and sabre.", "Foil, epee, and sabre are used in what sport?", "Fencing", ["Golf", "Curling", "Rowing"]],
    ["Curling", "Curling is played on ice with stones.", "Curling is played with what objects?", "Stones", ["Bats", "Rackets", "Hurdles"]],
    ["Hockey", "Ice hockey is played with a puck.", "Ice hockey is played with what?", "Puck", ["Ball only", "Disc golf driver", "Javelin"]],
    ["Volleyball", "Volleyball teams are separated by a net.", "Volleyball teams are separated by what?", "Net", ["Wall", "River", "Track"]],
    ["Boxing", "Boxing matches are divided into rounds.", "Boxing matches are divided into what?", "Rounds", ["Innings", "Sets only", "Quarters only"]],
    ["Skiing", "Alpine skiing takes place on snow-covered slopes.", "Alpine skiing takes place on what?", "Snow-covered slopes", ["Sand dunes only", "Swimming pools", "Ice rinks only"]],
    ["Cycling", "The Tour de France is a famous cycling race.", "The Tour de France is a famous race in which sport?", "Cycling", ["Rowing", "Skiing", "Boxing"]],
    ["Formula One", "Formula One is an international auto racing series.", "Formula One is what type of sport?", "Auto racing", ["Tennis", "Gymnastics", "Swimming"]],
    ["Archery", "Archery uses a bow to shoot arrows.", "Archery uses what to shoot arrows?", "Bow", ["Bat", "Club", "Racket"]],
    ["Table tennis", "Table tennis is played with paddles and a lightweight ball.", "Table tennis is played with paddles and what?", "Lightweight ball", ["Stone", "Puck", "Javelin"]]
  ],
  health: [
    ["Heart", "The heart pumps blood through the circulatory system.", "What organ pumps blood through the circulatory system?", "Heart", ["Liver", "Lung", "Kidney"]],
    ["Lungs", "The lungs exchange oxygen and carbon dioxide during breathing.", "Which organs exchange oxygen and carbon dioxide?", "Lungs", ["Stomach", "Spleen", "Pancreas"]],
    ["Water", "Water is essential for human body function.", "What liquid is essential for human body function?", "Water", ["Mercury", "Gasoline", "Vinegar only"]],
    ["Sleep", "Sleep supports healthy brain and body function.", "What supports healthy brain and body function?", "Sleep", ["Smoke", "Dehydration", "Noise exposure"]],
    ["Brain", "The brain is the body's main control center.", "What organ is the body's main control center?", "Brain", ["Appendix", "Spleen", "Gallbladder"]],
    ["Skeleton", "The adult human skeleton has 206 bones in the typical count.", "How many bones are in the typical adult human skeleton?", "206", ["106", "306", "406"]],
    ["Skin", "Skin is the body's largest organ.", "What is the body's largest organ?", "Skin", ["Heart", "Liver", "Lung"]],
    ["Vitamin C", "Vitamin C is found in many citrus fruits.", "Vitamin C is found in many what?", "Citrus fruits", ["Rocks", "Metals", "Clouds"]],
    ["Calcium", "Calcium helps build and maintain bones.", "Calcium helps maintain what?", "Bones", ["Hair color", "Eye shape", "Voice pitch only"]],
    ["Protein", "Protein helps build and repair body tissues.", "Protein helps build and repair what?", "Body tissues", ["Clouds", "Rocks", "Glass"]],
    ["Exercise", "Regular physical activity supports cardiovascular health.", "Regular physical activity supports what kind of health?", "Cardiovascular", ["Geological", "Astronomical", "Linguistic"]],
    ["Vaccines", "Vaccines train the immune system to recognize specific pathogens.", "Vaccines train which body system?", "Immune system", ["Digestive system only", "Skeletal system only", "Integumentary system only"]],
    ["Antibiotics", "Antibiotics treat bacterial infections, not viral infections.", "Antibiotics treat what kind of infections?", "Bacterial", ["Viral only", "Fungal only", "All injuries"]],
    ["Pulse", "Pulse measures heartbeats felt in an artery.", "Pulse measures what?", "Heartbeats", ["Bone length", "Lung color", "Skin tone"]],
    ["Blood pressure", "Blood pressure measures force of blood against artery walls.", "Blood pressure measures force against what?", "Artery walls", ["Teeth", "Hair", "Fingernails"]],
    ["Nutrition", "Nutrition is the study of food and how it affects the body.", "Nutrition studies food and its effect on what?", "Body", ["Planets", "Languages", "Minerals"]],
    ["Fiber", "Dietary fiber supports digestive health.", "Dietary fiber supports what kind of health?", "Digestive", ["Astronomical", "Musical", "Optical"]],
    ["Hygiene", "Handwashing helps reduce the spread of germs.", "Handwashing helps reduce the spread of what?", "Germs", ["Gravity", "Sunlight", "Magnetism"]],
    ["First aid", "First aid is immediate help given for injury or illness.", "First aid is what kind of help?", "Immediate", ["Historical", "Astronomical", "Financial only"]],
    ["Immune system", "The immune system helps defend the body against disease.", "What system helps defend the body against disease?", "Immune system", ["Solar system", "Metric system", "Transit system"]]
  ],
  food: [
    ["Rice", "Rice is a staple food for more than half of the world's population.", "Which grain is a staple for more than half of the world's population?", "Rice", ["Rye", "Oats", "Barley"]],
    ["Cacao", "Chocolate is made from cacao beans.", "Chocolate is made from what beans?", "Cacao beans", ["Coffee beans", "Soybeans", "Vanilla beans"]],
    ["Olive oil", "Olive oil is produced by pressing olives.", "Olive oil is produced from what?", "Olives", ["Grapes", "Dates", "Apples"]],
    ["Bread", "Bread is commonly made from flour, water, and yeast or another leavening method.", "Bread is commonly made from flour, water, and what?", "Yeast or another leavening method", ["Glass", "Copper", "Saltwater fish"]],
    ["Pasta", "Pasta is commonly made from wheat flour and water or eggs.", "Pasta is commonly made from wheat flour and what?", "Water or eggs", ["Coal", "Wax", "Sand"]],
    ["Cheese", "Cheese is made from milk.", "Cheese is made from what?", "Milk", ["Olive oil", "Cacao", "Rice"]],
    ["Yogurt", "Yogurt is made by bacterial fermentation of milk.", "Yogurt is made by fermentation of what?", "Milk", ["Wheat", "Cocoa", "Salt"]],
    ["Coffee", "Coffee is made from roasted coffee beans.", "Coffee is made from roasted what?", "Coffee beans", ["Cacao beans", "Rice grains", "Olives"]],
    ["Tea", "Tea is made from leaves of Camellia sinensis.", "Tea is made from leaves of what plant?", "Camellia sinensis", ["Rosa", "Quercus", "Acer"]],
    ["Honey", "Honey is made by bees from nectar.", "Honey is made by bees from what?", "Nectar", ["Sap only", "Sand", "Salt"]],
    ["Corn", "Corn is also called maize.", "Corn is also called what?", "Maize", ["Rye", "Millet only", "Sorghum only"]],
    ["Potato", "The potato is a tuber.", "A potato is what plant structure?", "Tuber", ["Nut", "Berry only", "Leaf"]],
    ["Tomato", "Botanically, a tomato is a fruit.", "Botanically, a tomato is what?", "Fruit", ["Root", "Seedless mineral", "Mushroom"]],
    ["Apple", "Apples grow on trees in the genus Malus.", "Apples grow on what?", "Trees", ["Vines only", "Moss", "Seaweed"]],
    ["Banana", "Bananas grow in clusters called hands.", "Bananas grow in clusters called what?", "Hands", ["Crowns", "Shells", "Panes"]],
    ["Soybean", "Soybeans are legumes.", "Soybeans are what?", "Legumes", ["Citrus fruits", "Tree nuts only", "Seaweed"]],
    ["Lentil", "Lentils are edible legumes.", "Lentils are what?", "Legumes", ["Berries", "Tubers only", "Mushrooms"]],
    ["Sushi", "Sushi is a Japanese dish often made with vinegared rice.", "Sushi often uses what kind of rice?", "Vinegared rice", ["Fried wheat", "Cacao rice", "Raw barley only"]],
    ["Pizza", "Pizza is strongly associated with Italian cuisine.", "Pizza is strongly associated with which cuisine?", "Italian", ["Norwegian", "Peruvian", "Thai only"]],
    ["Tortilla", "Tortillas are flatbreads common in Mexican cuisine.", "Tortillas are common in which cuisine?", "Mexican", ["Japanese", "French only", "Ethiopian only"]]
  ],
  languages: [
    ["Mandarin Chinese", "Mandarin Chinese has the largest number of native speakers.", "Which language has the largest number of native speakers?", "Mandarin Chinese", ["English", "Spanish", "Arabic"]],
    ["Arabic", "Arabic is written from right to left.", "Arabic is written in which direction?", "Right to left", ["Left to right", "Top to bottom only", "Bottom to top"]],
    ["English", "Modern English uses the Latin alphabet.", "Modern English uses which alphabet?", "Latin alphabet", ["Cyrillic", "Greek", "Hangul"]],
    ["Spanish", "Spanish is a Romance language.", "Spanish is what kind of language?", "Romance language", ["Germanic language", "Slavic language", "Sino-Tibetan language"]],
    ["French", "French is a Romance language.", "French is what kind of language?", "Romance language", ["Germanic language", "Uralic language", "Sino-Tibetan language"]],
    ["German", "German is a Germanic language.", "German belongs to which language branch?", "Germanic", ["Romance", "Slavic", "Dravidian"]],
    ["Russian", "Russian uses the Cyrillic alphabet.", "Russian uses which alphabet?", "Cyrillic", ["Latin", "Greek only", "Hangul"]],
    ["Greek", "Greek uses the Greek alphabet.", "Greek uses which alphabet?", "Greek alphabet", ["Latin", "Cyrillic", "Arabic"]],
    ["Hebrew", "Hebrew is written from right to left.", "Hebrew is written in which direction?", "Right to left", ["Left to right", "Top to bottom", "Bottom to top"]],
    ["Japanese", "Japanese uses kanji and kana writing systems.", "Japanese uses kanji and what?", "Kana", ["Runes", "Cyrillic only", "Greek only"]],
    ["Korean", "Korean is written with Hangul.", "Korean is written with what script?", "Hangul", ["Latin only", "Greek only", "Arabic only"]],
    ["Hindi", "Hindi is commonly written in Devanagari.", "Hindi is commonly written in which script?", "Devanagari", ["Hangul", "Latin only", "Greek"]],
    ["Swahili", "Swahili is widely spoken in East Africa.", "Swahili is widely spoken in which region?", "East Africa", ["Northern Europe", "Central America", "Oceania"]],
    ["Portuguese", "Portuguese is the official language of Brazil.", "Brazil's official language is what?", "Portuguese", ["Spanish", "French", "English only"]],
    ["Italian", "Italian is a Romance language.", "Italian belongs to which language group?", "Romance", ["Slavic", "Germanic", "Uralic"]],
    ["Dutch", "Dutch is a Germanic language.", "Dutch belongs to which language branch?", "Germanic", ["Romance", "Sino-Tibetan", "Semitic"]],
    ["Turkish", "Turkish uses a Latin-based alphabet.", "Modern Turkish uses what kind of alphabet?", "Latin-based", ["Cyrillic-only", "Greek-only", "Runic-only"]],
    ["Thai", "Thai uses the Thai script.", "Thai uses which script?", "Thai script", ["Hangul", "Cyrillic", "Greek"]],
    ["Vietnamese", "Vietnamese uses a Latin-based alphabet with diacritics.", "Vietnamese uses what kind of alphabet?", "Latin-based", ["Greek", "Cyrillic", "Runic"]],
    ["Zulu", "Zulu is a Bantu language spoken in southern Africa.", "Zulu is spoken in which region?", "Southern Africa", ["Arctic", "Northern Europe", "Central Asia"]]
  ],
  landmarks: [
    ["Eiffel Tower", "The Eiffel Tower is in Paris.", "The Eiffel Tower is in which city?", "Paris", ["Rome", "Berlin", "Madrid"]],
    ["Great Wall", "The Great Wall is in China.", "The Great Wall is in which country?", "China", ["Japan", "India", "Peru"]],
    ["Taj Mahal", "The Taj Mahal is in India.", "The Taj Mahal is in which country?", "India", ["Iran", "Egypt", "Turkey"]],
    ["Machu Picchu", "Machu Picchu is in Peru.", "Machu Picchu is in which country?", "Peru", ["Mexico", "Chile", "Spain"]],
    ["Colosseum", "The Colosseum is in Rome.", "The Colosseum is in which city?", "Rome", ["Athens", "Paris", "London"]],
    ["Statue of Liberty", "The Statue of Liberty is in New York Harbor.", "The Statue of Liberty is in which harbor?", "New York Harbor", ["Sydney Harbor", "Boston Harbor", "Tokyo Bay"]],
    ["Big Ben", "Big Ben is a nickname for the Great Bell at the Palace of Westminster.", "Big Ben is a nickname for what?", "Great Bell", ["Bridge", "River", "Palace only"]],
    ["Sydney Opera House", "The Sydney Opera House is in Australia.", "The Sydney Opera House is in which country?", "Australia", ["Austria", "Canada", "Spain"]],
    ["Christ the Redeemer", "Christ the Redeemer overlooks Rio de Janeiro.", "Christ the Redeemer overlooks which city?", "Rio de Janeiro", ["Buenos Aires", "Lisbon", "Lima"]],
    ["Pyramids of Giza", "The Pyramids of Giza are in Egypt.", "The Pyramids of Giza are in which country?", "Egypt", ["Mexico", "Greece", "Morocco"]],
    ["Stonehenge", "Stonehenge is in England.", "Stonehenge is in which country?", "England", ["Ireland", "France", "Norway"]],
    ["Burj Khalifa", "The Burj Khalifa is in Dubai.", "The Burj Khalifa is in which city?", "Dubai", ["Doha", "Riyadh", "Abu Dhabi"]],
    ["Mount Rushmore", "Mount Rushmore is in South Dakota.", "Mount Rushmore is in which U.S. state?", "South Dakota", ["Nevada", "Texas", "Florida"]],
    ["Angkor Wat", "Angkor Wat is in Cambodia.", "Angkor Wat is in which country?", "Cambodia", ["Thailand", "Laos", "Vietnam"]],
    ["Petra", "Petra is in Jordan.", "Petra is in which country?", "Jordan", ["Egypt", "Lebanon", "Oman"]],
    ["Acropolis", "The Acropolis is in Athens.", "The Acropolis is in which city?", "Athens", ["Rome", "Istanbul", "Paris"]],
    ["Alhambra", "The Alhambra is in Granada, Spain.", "The Alhambra is in which country?", "Spain", ["Portugal", "Morocco", "Italy"]],
    ["Sagrada Familia", "The Sagrada Familia is in Barcelona.", "The Sagrada Familia is in which city?", "Barcelona", ["Madrid", "Lisbon", "Paris"]],
    ["Neuschwanstein", "Neuschwanstein Castle is in Germany.", "Neuschwanstein Castle is in which country?", "Germany", ["Austria", "Switzerland", "France"]],
    ["Chichen Itza", "Chichen Itza is in Mexico.", "Chichen Itza is in which country?", "Mexico", ["Peru", "Guatemala", "Brazil"]]
  ],
  music: [
    ["Beethoven", "Ludwig van Beethoven composed nine numbered symphonies.", "How many numbered symphonies did Beethoven compose?", "Nine", ["Five", "Seven", "Twelve"]],
    ["Mozart", "Wolfgang Amadeus Mozart was a Classical-era composer.", "Mozart was a composer from which era?", "Classical", ["Baroque only", "Romantic only", "Modernist only"]],
    ["Bach", "Johann Sebastian Bach was a Baroque composer.", "Bach was a composer from which era?", "Baroque", ["Classical only", "Romantic only", "Jazz age"]],
    ["Jazz", "Jazz developed in the United States.", "Jazz developed in which country?", "United States", ["Norway", "Peru", "Thailand"]],
    ["Blues", "The blues strongly influenced jazz and rock music.", "The blues influenced jazz and what?", "Rock music", ["Cartography", "Sculpture", "Astronomy"]],
    ["Reggae", "Reggae originated in Jamaica.", "Reggae originated in which country?", "Jamaica", ["Japan", "Ireland", "Egypt"]],
    ["Salsa", "Salsa music has roots in Cuban and Caribbean musical traditions.", "Salsa music has roots in which region?", "Caribbean", ["Arctic", "Sahara", "Himalayas"]],
    ["Hip hop", "Hip hop culture emerged in New York City in the 1970s.", "Hip hop culture emerged in which city?", "New York City", ["Paris", "Tokyo", "Madrid"]],
    ["Opera", "Opera combines music and theater.", "Opera combines music and what?", "Theater", ["Cartography", "Geology", "Medicine only"]],
    ["Symphony", "A symphony is an extended musical composition for orchestra.", "A symphony is commonly written for what?", "Orchestra", ["Solo drum only", "Traffic signal", "Telescope"]],
    ["Guitar", "A standard guitar usually has six strings.", "A standard guitar usually has how many strings?", "Six", ["Four", "Eight", "Ten"]],
    ["Violin", "The violin is the smallest and highest-pitched standard orchestral string instrument.", "The violin belongs to what family?", "String", ["Brass", "Woodwind", "Percussion only"]],
    ["Piano", "A standard modern piano has 88 keys.", "A standard modern piano has how many keys?", "88", ["61", "76", "100"]],
    ["Drums", "Drums are percussion instruments.", "Drums are what kind of instruments?", "Percussion", ["String", "Brass", "Keyboard only"]],
    ["Trumpet", "The trumpet is a brass instrument.", "The trumpet belongs to which family?", "Brass", ["String", "Woodwind", "Percussion"]],
    ["Flute", "The flute is a woodwind instrument.", "The flute belongs to which family?", "Woodwind", ["Brass", "String", "Percussion"]],
    ["Choir", "A choir is a group of singers.", "A choir is a group of what?", "Singers", ["Painters", "Astronauts", "Pilots only"]],
    ["Conductor", "An orchestra conductor leads musical performance.", "Who leads an orchestra performance?", "Conductor", ["Goalkeeper", "Editor", "Navigator"]],
    ["Sheet music", "Sheet music uses notation to represent music.", "Sheet music represents music using what?", "Notation", ["Latitude", "Currency", "Fossils"]],
    ["Tempo", "Tempo is the speed of music.", "Tempo describes music's what?", "Speed", ["Color", "Weight", "Source"]]
  ],
  books: [
    ["Don Quixote", "Don Quixote was written by Miguel de Cervantes.", "Who wrote Don Quixote?", "Miguel de Cervantes", ["Dante", "Shakespeare", "Homer"]],
    ["Pride and Prejudice", "Pride and Prejudice was written by Jane Austen.", "Who wrote Pride and Prejudice?", "Jane Austen", ["Charlotte Bronte", "Mary Shelley", "Virginia Woolf"]],
    ["Frankenstein", "Frankenstein was written by Mary Shelley.", "Who wrote Frankenstein?", "Mary Shelley", ["Jane Austen", "Emily Dickinson", "Agatha Christie"]],
    ["Hamlet", "Hamlet was written by William Shakespeare.", "Who wrote Hamlet?", "William Shakespeare", ["Charles Dickens", "Mark Twain", "Homer"]],
    ["The Odyssey", "The Odyssey is traditionally attributed to Homer.", "The Odyssey is traditionally attributed to whom?", "Homer", ["Virgil", "Dante", "Sophocles"]],
    ["The Iliad", "The Iliad is traditionally attributed to Homer.", "The Iliad is traditionally attributed to whom?", "Homer", ["Ovid", "Virgil", "Plato"]],
    ["Moby-Dick", "Moby-Dick was written by Herman Melville.", "Who wrote Moby-Dick?", "Herman Melville", ["Mark Twain", "Nathaniel Hawthorne", "Walt Whitman"]],
    ["1984", "Nineteen Eighty-Four was written by George Orwell.", "Who wrote Nineteen Eighty-Four?", "George Orwell", ["Aldous Huxley", "Ray Bradbury", "Jules Verne"]],
    ["Animal Farm", "Animal Farm was written by George Orwell.", "Who wrote Animal Farm?", "George Orwell", ["C. S. Lewis", "J. R. R. Tolkien", "H. G. Wells"]],
    ["The Hobbit", "The Hobbit was written by J. R. R. Tolkien.", "Who wrote The Hobbit?", "J. R. R. Tolkien", ["C. S. Lewis", "George Orwell", "Roald Dahl"]],
    ["The Lord of the Rings", "The Lord of the Rings was written by J. R. R. Tolkien.", "Who wrote The Lord of the Rings?", "J. R. R. Tolkien", ["Jules Verne", "H. G. Wells", "Lewis Carroll"]],
    ["Alice's Adventures in Wonderland", "Alice's Adventures in Wonderland was written by Lewis Carroll.", "Who wrote Alice's Adventures in Wonderland?", "Lewis Carroll", ["J. M. Barrie", "A. A. Milne", "L. Frank Baum"]],
    ["The Great Gatsby", "The Great Gatsby was written by F. Scott Fitzgerald.", "Who wrote The Great Gatsby?", "F. Scott Fitzgerald", ["Ernest Hemingway", "John Steinbeck", "William Faulkner"]],
    ["To Kill a Mockingbird", "To Kill a Mockingbird was written by Harper Lee.", "Who wrote To Kill a Mockingbird?", "Harper Lee", ["Toni Morrison", "Maya Angelou", "Flannery O'Connor"]],
    ["Beloved", "Beloved was written by Toni Morrison.", "Who wrote Beloved?", "Toni Morrison", ["Alice Walker", "Zora Neale Hurston", "Harper Lee"]],
    ["The Catcher in the Rye", "The Catcher in the Rye was written by J. D. Salinger.", "Who wrote The Catcher in the Rye?", "J. D. Salinger", ["Jack Kerouac", "Kurt Vonnegut", "John Updike"]],
    ["War and Peace", "War and Peace was written by Leo Tolstoy.", "Who wrote War and Peace?", "Leo Tolstoy", ["Fyodor Dostoevsky", "Anton Chekhov", "Nikolai Gogol"]],
    ["Crime and Punishment", "Crime and Punishment was written by Fyodor Dostoevsky.", "Who wrote Crime and Punishment?", "Fyodor Dostoevsky", ["Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"]],
    ["The Divine Comedy", "The Divine Comedy was written by Dante Alighieri.", "Who wrote The Divine Comedy?", "Dante Alighieri", ["Petrarch", "Boccaccio", "Virgil"]],
    ["Things Fall Apart", "Things Fall Apart was written by Chinua Achebe.", "Who wrote Things Fall Apart?", "Chinua Achebe", ["Wole Soyinka", "Ngugi wa Thiong'o", "Ben Okri"]]
  ]
};

Object.entries(CATEGORY_BANKS).forEach(([category, facts]) => {
  RAW_FACTS.push(...simpleFacts(category, categorySource(category), facts));
});

const CATEGORY_ORDER = [
  "world-capitals", "countries", "geography", "history", "space", "governments", "money", "world-records",
  "video-games", "movies", "animals", "plants", "oceans", "climate", "inventions", "arts-culture",
  "sports", "health", "food", "languages", "landmarks", "music", "books"
];

const CATEGORY_LABELS = {
  "world-capitals": "World Capitals",
  countries: "Countries",
  geography: "Geography",
  history: "History",
  space: "Space",
  governments: "Governments",
  money: "Money",
  "world-records": "World Records",
  "video-games": "Video Games",
  movies: "Movies",
  animals: "Animals",
  plants: "Plants",
  oceans: "Oceans",
  climate: "Climate",
  inventions: "Inventions",
  "arts-culture": "Arts + Culture",
  sports: "Sports",
  health: "Health",
  food: "Food",
  languages: "Languages",
  landmarks: "Landmarks",
  music: "Music",
  books: "Books"
};

const PAGE_SIZE = 72;
const CATEGORY_DEFS = [
  { id: "all", label: "All Categories", count: RAW_FACTS.length },
  ...CATEGORY_ORDER.map((id) => ({ id, label: CATEGORY_LABELS[id], count: countFacts(id) }))
];

const state = {
  category: "all",
  search: "",
  page: 0,
  mode: "browse",
  sort: "default",
  score: 0,
  asked: 0,
  question: null,
  answered: false
};

const els = {
  totalFacts: document.querySelector("#totalFacts"),
  visibleFacts: document.querySelector("#visibleFacts"),
  categoryList: document.querySelector("#categoryList"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  themeToggle: document.querySelector("#themeToggle"),
  sectionTitle: document.querySelector("#sectionTitle"),
  sectionMeta: document.querySelector("#sectionMeta"),
  factList: document.querySelector("#factList"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  pageLabel: document.querySelector("#pageLabel"),
  browseView: document.querySelector("#browseView"),
  quizView: document.querySelector("#quizView"),
  quizMeta: document.querySelector("#quizMeta"),
  quizScore: document.querySelector("#quizScore"),
  questionCategory: document.querySelector("#questionCategory"),
  questionText: document.querySelector("#questionText"),
  answerGrid: document.querySelector("#answerGrid"),
  quizFeedback: document.querySelector("#quizFeedback"),
  nextQuestion: document.querySelector("#nextQuestion"),
  mapLabel: document.querySelector("#mapLabel"),
  canvas: document.querySelector("#knowledgeCanvas")
};

function entry(category, topic, text, source, question, answer, distractors) {
  const sourceObject = typeof source === "string" ? { label: source, url: "" } : source;
  return {
    category,
    topic,
    text,
    proof: sourceObject.label,
    url: sourceObject.url,
    question,
    answer,
    distractors
  };
}

function simpleFacts(category, source, rows) {
  return rows.map(([topic, text, question, answer, distractors]) => entry(category, topic, text, source, question, answer, distractors));
}

function capitalDistractors(country) {
  const index = CAPITALS.findIndex(([name]) => name === country);
  return [1, 2, 3].map((offset) => CAPITALS[(index + offset) % CAPITALS.length][1]);
}

function categorySource(category) {
  if (category === "oceans" || category === "climate") return SOURCES.noaa;
  if (category === "health") return SOURCES.who;
  if (category === "sports") return SOURCES.olympics;
  if (category === "movies") return SOURCES.imdb;
  if (category === "video-games") return SOURCES.gameHistory;
  if (category === "space") return SOURCES.nasa;
  return SOURCES.britannica;
}

function countFacts(category) {
  return RAW_FACTS.filter((item) => item.category === category).length;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function categoryLabel(categoryId) {
  return CATEGORY_DEFS.find((category) => category.id === categoryId)?.label || categoryId;
}

function searchableText(item) {
  return `${item.text} ${item.topic} ${item.proof} ${categoryLabel(item.category)} ${item.question || ""}`.toLowerCase();
}

function factsForState() {
  const facts = state.category === "all"
    ? RAW_FACTS
    : RAW_FACTS.filter((item) => item.category === state.category);
  const filtered = state.search ? facts.filter((item) => searchableText(item).includes(state.search)) : facts;
  return sortFacts(filtered);
}

function sortFacts(facts) {
  const sorted = [...facts];
  const byText = (a, b) => a.text.localeCompare(b.text);
  if (state.sort === "az") return sorted.sort(byText);
  if (state.sort === "za") return sorted.sort((a, b) => b.text.localeCompare(a.text));
  if (state.sort === "category") {
    return sorted.sort((a, b) => categoryLabel(a.category).localeCompare(categoryLabel(b.category)) || byText(a, b));
  }
  if (state.sort === "source") {
    return sorted.sort((a, b) => a.proof.localeCompare(b.proof) || byText(a, b));
  }
  return sorted;
}

function renderCategories() {
  els.categoryList.innerHTML = CATEGORY_DEFS.map((category) => `
    <button class="category-button ${category.id === state.category ? "is-active" : ""}" type="button" data-category="${category.id}">
      <strong>${category.label}</strong>
      <span>${formatNumber(category.count)}</span>
    </button>
  `).join("");
}

function renderFacts() {
  const facts = factsForState();
  const visibleCount = facts.length;
  const maxPage = Math.max(0, Math.ceil(visibleCount / PAGE_SIZE) - 1);
  state.page = Math.min(state.page, maxPage);
  const pageFacts = facts.slice(state.page * PAGE_SIZE, state.page * PAGE_SIZE + PAGE_SIZE);

  els.totalFacts.textContent = formatNumber(RAW_FACTS.length);
  els.visibleFacts.textContent = formatNumber(visibleCount);
  els.sectionTitle.textContent = categoryLabel(state.category);
  els.sectionMeta.textContent = state.search
    ? `Source-backed entries filtered by "${state.search}"`
    : state.sort === "default"
      ? "World Capitals now includes 245 alphabetized country and territory capitals. Other categories keep 20-50 real-world facts."
      : `Organized by ${els.sortSelect.options[els.sortSelect.selectedIndex].textContent}.`;
  els.factList.innerHTML = pageFacts.map(renderFactCard).join("");
  els.pageLabel.textContent = `Page ${formatNumber(state.page + 1)} of ${formatNumber(maxPage + 1)}`;
  els.prevPage.disabled = state.page === 0;
  els.nextPage.disabled = state.page >= maxPage;
  drawKnowledgeMap();
}

function renderFactCard(item) {
  const source = item.url
    ? `<a href="${item.url}" rel="noreferrer" target="_blank">${item.proof}</a>`
    : `<span>${item.proof}</span>`;
  return `
    <article class="fact-card">
      <div class="fact-card__tag">
        <span>${categoryLabel(item.category)}</span>
        <span>${item.topic}</span>
      </div>
      <p>${item.text}</p>
      <small>${source}</small>
    </article>
  `;
}

function setCategory(category) {
  state.category = category;
  state.page = 0;
  renderCategories();
  renderFacts();
  if (state.mode === "quiz") newQuestion();
}

function switchMode(mode) {
  state.mode = mode;
  document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === mode));
  els.browseView.hidden = mode !== "browse";
  els.quizView.hidden = mode !== "quiz";
  if (mode === "quiz") newQuestion();
}

function newQuestion() {
  const pool = factsForState().filter((item) => item.question && item.answer && item.distractors?.length >= 3);
  const fallback = RAW_FACTS.filter((item) => item.question && item.answer);
  const source = pool.length ? pool : fallback;
  const item = source[Math.floor(Math.random() * source.length)];
  state.question = item;
  state.answered = false;
  const answers = [item.answer, ...item.distractors].filter((answer, index, array) => array.indexOf(answer) === index);
  answers.sort(() => Math.random() - 0.5);
  els.quizMeta.textContent = `Questions draw from ${categoryLabel(state.category)}.`;
  els.questionCategory.textContent = categoryLabel(item.category);
  els.questionText.textContent = item.question;
  els.quizFeedback.textContent = "";
  els.answerGrid.innerHTML = answers.slice(0, 4).map((answer) => `<button type="button" data-answer="${answer}">${answer}</button>`).join("");
}

function answerQuestion(answer, button) {
  if (state.answered) return;
  state.answered = true;
  state.asked += 1;
  const correct = answer === state.question.answer;
  if (correct) state.score += 1;
  els.quizScore.textContent = `${state.score}/${state.asked}`;
  els.quizFeedback.textContent = correct ? "Correct." : `Not quite. The answer is ${state.question.answer}.`;
  els.answerGrid.querySelectorAll("button").forEach((answerButton) => {
    answerButton.classList.toggle("correct", answerButton.dataset.answer === state.question.answer);
  });
  if (!correct) button.classList.add("wrong");
}

function drawKnowledgeMap() {
  const ctx = els.canvas.getContext("2d");
  const width = els.canvas.width;
  const height = els.canvas.height;
  const styles = getComputedStyle(document.body);
  const panel = styles.getPropertyValue("--panel").trim();
  const ink = styles.getPropertyValue("--ink").trim();
  const accent = styles.getPropertyValue("--accent").trim();
  const line = styles.getPropertyValue("--line").trim();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, width, height);

  const cats = CATEGORY_DEFS.slice(1);
  const max = Math.max(...cats.map((category) => category.count));
  const barWidth = width / cats.length - 4;
  cats.forEach((category, index) => {
    const barHeight = Math.max(8, (category.count / max) * (height - 54));
    const x = index * (barWidth + 4) + 4;
    const y = height - barHeight - 28;
    ctx.fillStyle = category.id === state.category || state.category === "all" ? accent : line;
    ctx.fillRect(x, y, barWidth, barHeight);
    if (index % 2 === 0) {
      ctx.fillStyle = ink;
      ctx.font = "700 9px system-ui";
      ctx.save();
      ctx.translate(x + 1, height - 8);
      ctx.rotate(-Math.PI / 5);
      ctx.fillText(category.label.split(" ")[0], 0, 0);
      ctx.restore();
    }
  });

  els.mapLabel.textContent = categoryLabel(state.category);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const isDark = theme === "dark";
  els.themeToggle.textContent = isDark ? "Light" : "Dark";
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("factforge-theme", theme);
  drawKnowledgeMap();
}

els.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) setCategory(button.dataset.category);
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value.trim().toLowerCase();
  state.page = 0;
  renderFacts();
});

els.sortSelect.addEventListener("change", () => {
  state.sort = els.sortSelect.value;
  state.page = 0;
  renderFacts();
  if (state.mode === "quiz") newQuestion();
});

els.themeToggle.addEventListener("click", () => {
  applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
});

els.prevPage.addEventListener("click", () => {
  state.page = Math.max(0, state.page - 1);
  renderFacts();
});

els.nextPage.addEventListener("click", () => {
  state.page += 1;
  renderFacts();
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});

els.answerGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (button) answerQuestion(button.dataset.answer, button);
});

els.nextQuestion.addEventListener("click", newQuestion);

applyTheme(localStorage.getItem("factforge-theme") || "dark");
renderCategories();
renderFacts();
newQuestion();
