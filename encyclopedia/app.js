const SOURCES = {
  nasa: { label: "NASA Science", url: "https://science.nasa.gov/solar-system/" },
  nasaPlanets: { label: "NASA planet facts", url: "https://science.nasa.gov/solar-system/planets/" },
  worldBank: { label: "World Bank Open Data", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD" },
  guinnessEverest: { label: "Guinness World Records", url: "https://www.guinnessworldrecords.com/world-records/highest-mountain" },
  guinnessMaunaKea: { label: "Guinness World Records", url: "https://www.guinnessworldrecords.com/world-records/tallest-mountain" },
  un: { label: "United Nations", url: "https://www.un.org/en/about-us/member-states" },
  unSecurity: { label: "United Nations Security Council", url: "https://www.un.org/securitycouncil/content/current-members" },
  cern: { label: "CERN", url: "https://home.cern/science/computing/birth-web" },
  nistPrefixes: { label: "NIST SI prefixes", url: "https://www.nist.gov/pml/owm/metric-si-prefixes" },
  smithsonianLeap: { label: "Smithsonian", url: "https://airandspace.si.edu/stories/editorial/science-leap-year" },
  usGov: { label: "U.S. government", url: "https://www.usa.gov/branches-of-government" },
  ukParliament: { label: "UK Parliament", url: "https://www.parliament.uk/about/how/role/relations-with-other-institutions/parliament-crown/" },
  reserveBank: { label: "Federal Reserve", url: "https://www.federalreserve.gov/aboutthefed.htm" },
  ecb: { label: "European Central Bank", url: "https://www.ecb.europa.eu/euro/intro/html/index.en.html" },
  britannica: { label: "Encyclopaedia Britannica", url: "https://www.britannica.com/" },
  iso: { label: "ISO 4217 currency codes", url: "https://www.iso.org/iso-4217-currency-codes.html" },
  noaa: { label: "NOAA", url: "https://oceanservice.noaa.gov/facts/marianatrench.html" }
};

const REAL_FACTS = [
  fact("geography", "Earth", "Antarctica is Earth's southernmost continent.", "National Geographic / Britannica reference", "What is Earth's southernmost continent?", "Antarctica", ["Africa", "Australia", "South America"]),
  fact("geography", "Mount Everest", "Mount Everest is the highest mountain on Earth above sea level, at 8,848.86 meters.", SOURCES.guinnessEverest, "Which mountain is highest above sea level?", "Mount Everest", ["K2", "Mauna Kea", "Kangchenjunga"]),
  fact("geography", "Mauna Kea", "Mauna Kea is the world's tallest mountain when measured from submarine base to peak.", SOURCES.guinnessMaunaKea, "Which mountain is tallest from base to peak?", "Mauna Kea", ["Everest", "Denali", "K2"]),
  fact("geography", "Mariana Trench", "The Mariana Trench is the deepest ocean trench on Earth.", SOURCES.noaa, "What is Earth's deepest ocean trench?", "Mariana Trench", ["Puerto Rico Trench", "Java Trench", "Tonga Trench"]),
  fact("geography", "Continents", "Africa is the second-largest continent by land area.", "Britannica world geography reference", "Which continent is second-largest by land area?", "Africa", ["Europe", "Australia", "Antarctica"]),
  fact("geography", "Oceans", "The Pacific Ocean is Earth's largest ocean basin.", "NOAA ocean reference", "What is Earth's largest ocean basin?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]),
  fact("geography", "Equator", "The equator is an imaginary line at 0 degrees latitude.", "Geography reference", "What latitude is the equator?", "0 degrees", ["23.5 degrees north", "90 degrees", "180 degrees"]),
  fact("geography", "Prime Meridian", "The prime meridian is the 0-degree line of longitude.", "Geography reference", "What longitude is the prime meridian?", "0 degrees", ["90 degrees east", "180 degrees", "23.5 degrees west"]),
  fact("geography", "Sahara", "The Sahara is the largest hot desert on Earth.", "Britannica world geography reference", "What is Earth's largest hot desert?", "Sahara", ["Gobi", "Kalahari", "Great Victoria"]),
  fact("geography", "Amazon Basin", "The Amazon Basin is the world's largest tropical rainforest region.", "Britannica world geography reference", "What region contains the largest tropical rainforest?", "Amazon Basin", ["Congo Basin", "Borneo", "Daintree"]),

  fact("countries", "United States", "The capital of the United States is Washington, D.C.", "U.S. government reference", "What is the capital of the United States?", "Washington, D.C.", ["New York", "Philadelphia", "Los Angeles"]),
  fact("countries", "Canada", "The capital of Canada is Ottawa.", "Government of Canada reference", "What is the capital of Canada?", "Ottawa", ["Toronto", "Vancouver", "Montreal"]),
  fact("countries", "Mexico", "The capital of Mexico is Mexico City.", "Government of Mexico reference", "What is the capital of Mexico?", "Mexico City", ["Guadalajara", "Monterrey", "Cancun"]),
  fact("countries", "Brazil", "The capital of Brazil is Brasilia.", "Brazil government reference", "What is the capital of Brazil?", "Brasilia", ["Rio de Janeiro", "Sao Paulo", "Salvador"]),
  fact("countries", "Argentina", "The capital of Argentina is Buenos Aires.", "Argentina government reference", "What is the capital of Argentina?", "Buenos Aires", ["Cordoba", "Rosario", "Mendoza"]),
  fact("countries", "United Kingdom", "The capital of the United Kingdom is London.", "UK government reference", "What is the capital of the United Kingdom?", "London", ["Edinburgh", "Cardiff", "Manchester"]),
  fact("countries", "France", "The capital of France is Paris.", "France government reference", "What is the capital of France?", "Paris", ["Lyon", "Marseille", "Nice"]),
  fact("countries", "Germany", "The capital of Germany is Berlin.", "Germany government reference", "What is the capital of Germany?", "Berlin", ["Munich", "Hamburg", "Frankfurt"]),
  fact("countries", "Italy", "The capital of Italy is Rome.", "Italy government reference", "What is the capital of Italy?", "Rome", ["Milan", "Naples", "Turin"]),
  fact("countries", "Spain", "The capital of Spain is Madrid.", "Spain government reference", "What is the capital of Spain?", "Madrid", ["Barcelona", "Seville", "Valencia"]),
  fact("countries", "Japan", "The capital of Japan is Tokyo.", "Japan government reference", "What is the capital of Japan?", "Tokyo", ["Kyoto", "Osaka", "Hiroshima"]),
  fact("countries", "India", "The capital of India is New Delhi.", "Government of India reference", "What is the capital of India?", "New Delhi", ["Mumbai", "Kolkata", "Bengaluru"]),
  fact("countries", "China", "The capital of China is Beijing.", "China government reference", "What is the capital of China?", "Beijing", ["Shanghai", "Shenzhen", "Guangzhou"]),
  fact("countries", "Australia", "The capital of Australia is Canberra.", "Australian government reference", "What is the capital of Australia?", "Canberra", ["Sydney", "Melbourne", "Perth"]),
  fact("countries", "South Africa", "South Africa has three capital cities: Pretoria, Cape Town, and Bloemfontein.", "South African government reference", "How many capital cities does South Africa have?", "Three", ["One", "Two", "Four"]),

  fact("history", "Printing", "Johannes Gutenberg's movable-type printing press was developed in Europe in the 15th century.", "Britannica history reference", "Who is closely associated with the movable-type printing press in Europe?", "Johannes Gutenberg", ["Isaac Newton", "Galileo Galilei", "Leonardo da Vinci"]),
  fact("history", "American Independence", "The United States Declaration of Independence was adopted on July 4, 1776.", "U.S. National Archives reference", "When was the U.S. Declaration of Independence adopted?", "July 4, 1776", ["July 14, 1789", "June 15, 1215", "November 11, 1918"]),
  fact("history", "French Revolution", "The Storming of the Bastille took place on July 14, 1789.", "Britannica history reference", "When did the Storming of the Bastille take place?", "July 14, 1789", ["July 4, 1776", "June 28, 1914", "May 8, 1945"]),
  fact("history", "World War I", "World War I began in 1914 and ended in 1918.", "Britannica history reference", "In what year did World War I begin?", "1914", ["1918", "1939", "1945"]),
  fact("history", "World War II", "World War II began in 1939 and ended in 1945.", "Britannica history reference", "In what year did World War II end?", "1945", ["1918", "1939", "1969"]),
  fact("history", "Moon Landing", "Apollo 11 landed humans on the Moon in July 1969.", SOURCES.nasa, "Which Apollo mission first landed humans on the Moon?", "Apollo 11", ["Apollo 8", "Apollo 13", "Gemini 4"]),
  fact("history", "Berlin Wall", "The Berlin Wall opened on November 9, 1989.", "German history reference", "In what year did the Berlin Wall open?", "1989", ["1945", "1961", "1991"]),
  fact("history", "Magna Carta", "Magna Carta was sealed in 1215.", "UK Parliament historical reference", "In what year was Magna Carta sealed?", "1215", ["1066", "1492", "1776"]),
  fact("history", "United Nations", "The United Nations Charter entered into force on October 24, 1945.", SOURCES.un, "When did the UN Charter enter into force?", "October 24, 1945", ["July 4, 1776", "November 9, 1989", "January 1, 2000"]),
  fact("history", "World Wide Web", "Tim Berners-Lee invented the World Wide Web at CERN in 1989.", SOURCES.cern, "Who invented the World Wide Web at CERN?", "Tim Berners-Lee", ["Alan Turing", "Grace Hopper", "Vint Cerf"]),

  fact("space", "Solar System", "NASA describes our solar system as having eight planets.", SOURCES.nasaPlanets, "How many planets are in NASA's standard solar-system count?", "8", ["5", "7", "9"]),
  fact("space", "Dwarf Planets", "NASA lists five officially recognized dwarf planets in our solar system.", SOURCES.nasaPlanets, "How many officially recognized dwarf planets does NASA list?", "5", ["3", "8", "12"]),
  fact("space", "Mercury", "Mercury is the nearest planet to the Sun.", SOURCES.nasaPlanets, "Which planet is nearest to the Sun?", "Mercury", ["Venus", "Earth", "Mars"]),
  fact("space", "Venus", "Venus is the second planet from the Sun.", SOURCES.nasaPlanets, "Which planet is second from the Sun?", "Venus", ["Mercury", "Earth", "Mars"]),
  fact("space", "Earth", "Earth is the third planet from the Sun.", SOURCES.nasaPlanets, "Which planet is third from the Sun?", "Earth", ["Venus", "Mars", "Jupiter"]),
  fact("space", "Mars", "Mars is the fourth planet from the Sun.", SOURCES.nasaPlanets, "Which planet is fourth from the Sun?", "Mars", ["Earth", "Jupiter", "Venus"]),
  fact("space", "Jupiter", "Jupiter is the largest planet in the solar system.", SOURCES.nasaPlanets, "What is the largest planet in the solar system?", "Jupiter", ["Saturn", "Earth", "Neptune"]),
  fact("space", "Saturn", "Saturn is the sixth planet from the Sun.", SOURCES.nasaPlanets, "Which planet is sixth from the Sun?", "Saturn", ["Jupiter", "Uranus", "Mars"]),
  fact("space", "Uranus", "Uranus is the seventh planet from the Sun.", SOURCES.nasaPlanets, "Which planet is seventh from the Sun?", "Uranus", ["Saturn", "Neptune", "Jupiter"]),
  fact("space", "Neptune", "Neptune is the eighth planet from the Sun.", SOURCES.nasaPlanets, "Which planet is eighth from the Sun?", "Neptune", ["Uranus", "Saturn", "Pluto"]),
  fact("space", "Milky Way", "NASA places our solar system in the Milky Way galaxy.", SOURCES.nasa, "Which galaxy contains our solar system?", "Milky Way", ["Andromeda", "Triangulum", "Large Magellanic Cloud"]),
  fact("space", "Olympus Mons", "Olympus Mons on Mars is the highest mountain in the solar system according to Guinness World Records.", { label: "Guinness World Records", url: "https://www.guinnessworldrecords.com/world-records/highest-mountain-in-the-solar-system" }, "What is the highest mountain in the solar system?", "Olympus Mons", ["Everest", "Mauna Kea", "Maxwell Montes"]),

  fact("governments", "United Nations", "The United Nations has 193 Member States.", SOURCES.un, "How many Member States does the United Nations have?", "193", ["195", "200", "181"]),
  fact("governments", "Security Council", "The UN Security Council has five permanent members.", SOURCES.unSecurity, "How many permanent members are on the UN Security Council?", "5", ["10", "15", "3"]),
  fact("governments", "United States", "The U.S. federal government has legislative, executive, and judicial branches.", SOURCES.usGov, "How many branches does the U.S. federal government have?", "3", ["2", "4", "5"]),
  fact("governments", "United Kingdom", "The UK Parliament is made up of the Crown, the House of Commons, and the House of Lords.", SOURCES.ukParliament, "Which institution is part of the UK Parliament?", "House of Commons", ["Bundestag", "National Diet", "Dail Eireann"]),
  fact("governments", "European Union", "The European Central Bank is the central bank for the euro.", SOURCES.ecb, "Which bank is the central bank for the euro?", "European Central Bank", ["Federal Reserve", "Bank of Japan", "World Bank"]),
  fact("governments", "Federal Reserve", "The Federal Reserve is the central bank of the United States.", SOURCES.reserveBank, "What is the central bank of the United States?", "Federal Reserve", ["World Bank", "IMF", "European Central Bank"]),
  fact("governments", "Japan", "Japan's national legislature is the National Diet.", "Japan government reference", "What is Japan's national legislature called?", "National Diet", ["Congress", "Parliament of Canada", "Bundestag"]),
  fact("governments", "Germany", "Germany's federal parliament includes the Bundestag.", "German Bundestag reference", "What is Germany's federal parliament's directly elected chamber called?", "Bundestag", ["House of Commons", "National Diet", "Senate"]),
  fact("governments", "India", "India's Parliament consists of the President, Lok Sabha, and Rajya Sabha.", "Parliament of India reference", "Which house is part of India's Parliament?", "Lok Sabha", ["Bundestag", "House of Lords", "Knesset"]),
  fact("governments", "Australia", "Australia is a federal parliamentary constitutional monarchy.", "Australian government reference", "Australia is a federal parliamentary what?", "constitutional monarchy", ["absolute monarchy", "city-state", "confederation only"]),

  fact("world-records", "Highest mountain", "Everest is the highest mountain on Earth above sea level.", SOURCES.guinnessEverest, "What mountain is the highest above sea level?", "Everest", ["Mauna Kea", "Denali", "Aconcagua"]),
  fact("world-records", "Tallest mountain", "Mauna Kea is the tallest mountain from base to peak.", SOURCES.guinnessMaunaKea, "What mountain is tallest from base to peak?", "Mauna Kea", ["Everest", "K2", "Elbrus"]),
  fact("world-records", "Everest ascents", "Guinness World Records lists Kami Rita Sherpa with 32 Everest ascents after his May 17, 2026 summit.", { label: "Guinness World Records, June 2026", url: "https://www.guinnessworldrecords.com/world-records/63829-most-conquests-of-mt-everest" }, "Who is listed with 32 Everest ascents by Guinness in 2026?", "Kami Rita Sherpa", ["Tenzing Norgay", "Edmund Hillary", "Reinhold Messner"]),
  fact("world-records", "Solar-system mountain", "Olympus Mons is listed by Guinness as the highest mountain in the solar system.", { label: "Guinness World Records", url: "https://www.guinnessworldrecords.com/world-records/highest-mountain-in-the-solar-system" }, "Which mountain is listed as highest in the solar system?", "Olympus Mons", ["Everest", "Mauna Kea", "K2"]),
  fact("world-records", "Largest planet", "Jupiter is the largest planet in the solar system.", SOURCES.nasaPlanets, "What is the largest planet in the solar system?", "Jupiter", ["Saturn", "Neptune", "Earth"]),
  fact("world-records", "Largest ocean", "The Pacific Ocean is Earth's largest ocean basin.", "NOAA ocean reference", "What is Earth's largest ocean basin?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Southern Ocean"]),
  fact("world-records", "Deepest trench", "NOAA identifies the Mariana Trench as the deepest part of the ocean.", SOURCES.noaa, "What is the deepest part of the ocean?", "Mariana Trench", ["Java Trench", "Puerto Rico Trench", "Peru-Chile Trench"]),
  fact("world-records", "Largest hot desert", "The Sahara is Earth's largest hot desert.", "Britannica world geography reference", "What is Earth's largest hot desert?", "Sahara", ["Gobi", "Mojave", "Kalahari"]),

  fact("money", "U.S. dollar", "The ISO 4217 currency code for the U.S. dollar is USD.", SOURCES.iso, "What is the ISO code for the U.S. dollar?", "USD", ["EUR", "JPY", "GBP"]),
  fact("money", "Euro", "The ISO 4217 currency code for the euro is EUR.", SOURCES.iso, "What is the ISO code for the euro?", "EUR", ["USD", "JPY", "CAD"]),
  fact("money", "Japanese yen", "The ISO 4217 currency code for the Japanese yen is JPY.", SOURCES.iso, "What is the ISO code for the Japanese yen?", "JPY", ["CNY", "KRW", "EUR"]),
  fact("money", "Pound sterling", "The ISO 4217 currency code for pound sterling is GBP.", SOURCES.iso, "What is the ISO code for pound sterling?", "GBP", ["USD", "EUR", "AUD"]),
  fact("money", "Canadian dollar", "The ISO 4217 currency code for the Canadian dollar is CAD.", SOURCES.iso, "What is the ISO code for the Canadian dollar?", "CAD", ["USD", "AUD", "CHF"]),
  fact("money", "World Bank GDP", "The World Bank publishes GDP in current U.S. dollars under indicator NY.GDP.MKTP.CD.", SOURCES.worldBank, "What is the World Bank indicator code for GDP in current U.S. dollars?", "NY.GDP.MKTP.CD", ["SP.POP.TOTL", "EN.ATM.CO2E.KT", "FP.CPI.TOTL.ZG"]),
  fact("money", "Central bank", "The Federal Reserve is the central bank of the United States.", SOURCES.reserveBank, "What is the U.S. central bank?", "Federal Reserve", ["World Bank", "European Central Bank", "Bank for International Settlements"]),
  fact("money", "Euro system", "The European Central Bank is the central bank for the euro.", SOURCES.ecb, "What is the central bank for the euro?", "European Central Bank", ["Federal Reserve", "Bank of England", "Bank of Canada"]),
  fact("money", "Indian rupee", "The ISO 4217 currency code for the Indian rupee is INR.", SOURCES.iso, "What is the ISO code for the Indian rupee?", "INR", ["IDR", "JPY", "CNY"]),
  fact("money", "Chinese yuan", "The ISO 4217 currency code for the Chinese yuan renminbi is CNY.", SOURCES.iso, "What is the ISO code for the Chinese yuan renminbi?", "CNY", ["JPY", "KRW", "INR"]),

  fact("science-tech", "Web", "Tim Berners-Lee proposed the World Wide Web at CERN in 1989.", SOURCES.cern, "Who proposed the World Wide Web at CERN?", "Tim Berners-Lee", ["Steve Jobs", "Bill Gates", "Alan Kay"]),
  fact("science-tech", "Metric prefixes", "The SI prefix kilo represents a factor of 1,000.", SOURCES.nistPrefixes, "What factor does kilo represent?", "1,000", ["100", "10", "0.001"]),
  fact("science-tech", "Metric prefixes", "The SI prefix milli represents a factor of one thousandth.", SOURCES.nistPrefixes, "What factor does milli represent?", "one thousandth", ["one hundredth", "one million", "one tenth"]),
  fact("science-tech", "Leap year", "In the Gregorian calendar, century years are leap years only when divisible by 400.", SOURCES.smithsonianLeap, "In the Gregorian calendar, a century year is a leap year when divisible by what?", "400", ["4", "100", "1,000"]),
  fact("science-tech", "Light", "A light-year is a unit of distance, not time.", "NASA space reference", "What does a light-year measure?", "distance", ["time", "mass", "temperature"]),
  fact("science-tech", "Water", "Pure water freezes at 0 degrees Celsius at standard atmospheric pressure.", "Chemistry reference", "At standard pressure, pure water freezes at what Celsius temperature?", "0", ["32", "100", "-40"]),
  fact("science-tech", "Boiling water", "Pure water boils at 100 degrees Celsius at standard atmospheric pressure.", "Chemistry reference", "At standard pressure, pure water boils at what Celsius temperature?", "100", ["0", "32", "212"]),
  fact("science-tech", "Earth rotation", "Earth rotates once relative to the Sun in about 24 hours.", "Astronomy reference", "About how long is a solar day on Earth?", "24 hours", ["12 hours", "30 days", "365 days"])
,

  fact("animals", "Blue whale", "The blue whale is the largest animal known to have lived on Earth.", "Smithsonian ocean reference", "What is the largest animal known to have lived on Earth?", "Blue whale", ["African elephant", "Whale shark", "Giraffe"]),
  fact("animals", "Cheetah", "The cheetah is the fastest land animal.", "Smithsonian animal reference", "What is the fastest land animal?", "Cheetah", ["Lion", "Pronghorn", "Horse"]),
  fact("animals", "Emperor penguin", "The emperor penguin is the tallest living penguin species.", "National Geographic animal reference", "What is the tallest living penguin species?", "Emperor penguin", ["King penguin", "Adelie penguin", "Gentoo penguin"]),
  fact("animals", "Monarch butterfly", "Monarch butterflies are known for long-distance migration in North America.", "U.S. Fish and Wildlife Service reference", "Which butterfly is known for long-distance migration in North America?", "Monarch butterfly", ["Painted lady", "Swallowtail", "Blue morpho"]),

  fact("plants", "Giant sequoia", "Giant sequoias are among the largest trees by volume.", "National Park Service reference", "Which trees are among the largest by volume?", "Giant sequoias", ["Baobabs", "Mangroves", "Banyans"]),
  fact("plants", "Photosynthesis", "Photosynthesis lets plants use light energy to make sugars from carbon dioxide and water.", "Biology reference", "What process lets plants use light energy to make sugars?", "Photosynthesis", ["Respiration", "Fermentation", "Evaporation"]),
  fact("plants", "Bamboo", "Some bamboo species are grasses.", "Botany reference", "Some bamboo species belong to which plant family type?", "Grasses", ["Conifers", "Mosses", "Ferns"]),
  fact("plants", "Saguaro", "The saguaro cactus is native to the Sonoran Desert.", "National Park Service reference", "The saguaro cactus is native to which desert?", "Sonoran Desert", ["Sahara", "Gobi", "Atacama"]),

  fact("oceans", "Pacific Ocean", "The Pacific Ocean is the largest ocean basin on Earth.", "NOAA ocean reference", "What is Earth's largest ocean basin?", "Pacific Ocean", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"]),
  fact("oceans", "Salinity", "Ocean water is salty because it contains dissolved salts.", "NOAA ocean reference", "Why is ocean water salty?", "It contains dissolved salts", ["It contains sugar", "It contains no minerals", "It is always frozen"]),
  fact("oceans", "Coral reefs", "Coral reefs are built by colonies of tiny animals called coral polyps.", "NOAA coral reference", "What tiny animals build coral reefs?", "Coral polyps", ["Krill", "Clams", "Sea stars"]),
  fact("oceans", "Tides", "The Moon is the main driver of Earth's ocean tides.", "NOAA tide reference", "What is the main driver of Earth's ocean tides?", "The Moon", ["Mars", "Clouds", "Volcanoes"]),

  fact("climate", "Weather", "Weather describes short-term atmospheric conditions.", "NOAA weather reference", "What does weather describe?", "Short-term atmospheric conditions", ["Only ocean salinity", "Plate movement", "Moon phases"]),
  fact("climate", "Climate", "Climate describes average weather patterns over longer periods.", "NOAA climate reference", "What does climate describe?", "Average weather patterns over longer periods", ["A single storm", "One afternoon", "A volcano only"]),
  fact("climate", "Greenhouse effect", "The greenhouse effect helps keep Earth warmer than it would be without greenhouse gases.", "NASA climate reference", "What does the greenhouse effect help do?", "Keep Earth warmer", ["Stop gravity", "Remove oceans", "Create tides"]),
  fact("climate", "Carbon dioxide", "Carbon dioxide is a greenhouse gas.", "NASA climate reference", "Carbon dioxide is what kind of gas?", "Greenhouse gas", ["Noble gas only", "Metal vapor", "Liquid fuel"]),

  fact("inventions", "Telephone", "Alexander Graham Bell received a U.S. patent for the telephone in 1876.", "U.S. Patent history reference", "Who received a U.S. patent for the telephone in 1876?", "Alexander Graham Bell", ["Thomas Edison", "Nikola Tesla", "Guglielmo Marconi"]),
  fact("inventions", "Light bulb", "Thomas Edison is associated with developing a practical incandescent light bulb.", "Smithsonian invention reference", "Who is associated with a practical incandescent light bulb?", "Thomas Edison", ["James Watt", "Ada Lovelace", "Samuel Morse"]),
  fact("inventions", "Airplane", "The Wright brothers made their first powered flight in 1903.", "National Park Service aviation reference", "Who made a famous first powered flight in 1903?", "Wright brothers", ["Montgolfier brothers", "Bell Labs", "Apollo 11"]),
  fact("inventions", "Printing press", "Movable-type printing helped books spread more widely in Europe.", "History reference", "What technology helped books spread more widely in Europe?", "Movable-type printing", ["Telegraph", "Steam turbine", "Radio telescope"]),

  fact("arts-culture", "Mona Lisa", "The Mona Lisa was painted by Leonardo da Vinci.", "Louvre reference", "Who painted the Mona Lisa?", "Leonardo da Vinci", ["Michelangelo", "Raphael", "Claude Monet"]),
  fact("arts-culture", "Starry Night", "The Starry Night was painted by Vincent van Gogh.", "Museum of Modern Art reference", "Who painted The Starry Night?", "Vincent van Gogh", ["Pablo Picasso", "Georgia O'Keeffe", "Rembrandt"]),
  fact("arts-culture", "Shakespeare", "William Shakespeare wrote Hamlet.", "British Library reference", "Who wrote Hamlet?", "William Shakespeare", ["Charles Dickens", "Jane Austen", "Mark Twain"]),
  fact("arts-culture", "Beethoven", "Ludwig van Beethoven composed nine numbered symphonies.", "Classical music reference", "How many numbered symphonies did Beethoven compose?", "Nine", ["Five", "Seven", "Twelve"]),

  fact("sports", "Olympics", "The modern Olympic Games began in Athens in 1896.", "International Olympic Committee reference", "Where did the modern Olympic Games begin in 1896?", "Athens", ["Paris", "London", "Rome"]),
  fact("sports", "Soccer", "A standard outdoor soccer team has 11 players on the field.", "IFAB Laws of the Game reference", "How many players are on the field for one standard soccer team?", "11", ["9", "10", "12"]),
  fact("sports", "Basketball", "Basketball was invented by James Naismith in 1891.", "Naismith Memorial Basketball Hall of Fame reference", "Who invented basketball in 1891?", "James Naismith", ["Babe Ruth", "Michael Jordan", "Abner Doubleday"]),
  fact("sports", "Tennis", "A tennis Grand Slam singles match is played at one of four major tournaments.", "Tennis reference", "How many major tournaments make up tennis's Grand Slam?", "Four", ["Two", "Three", "Six"]),

  fact("health", "Heart", "The heart pumps blood through the circulatory system.", "MedlinePlus health reference", "What organ pumps blood through the circulatory system?", "Heart", ["Liver", "Lung", "Kidney"]),
  fact("health", "Lungs", "The lungs exchange oxygen and carbon dioxide during breathing.", "MedlinePlus health reference", "Which organs exchange oxygen and carbon dioxide during breathing?", "Lungs", ["Stomach", "Spleen", "Pancreas"]),
  fact("health", "Hydration", "Water is essential for human body function.", "CDC health reference", "What liquid is essential for human body function?", "Water", ["Mercury", "Gasoline", "Vinegar only"]),
  fact("health", "Sleep", "Sleep supports healthy brain and body function.", "NIH health reference", "What supports healthy brain and body function?", "Sleep", ["Smoke", "Dehydration", "Noise exposure"]),

  fact("food", "Rice", "Rice is a staple food for more than half of the world's population.", "FAO food reference", "Which grain is a staple for more than half of the world's population?", "Rice", ["Rye", "Oats", "Barley"]),
  fact("food", "Cacao", "Chocolate is made from cacao beans.", "Food history reference", "Chocolate is made from what beans?", "Cacao beans", ["Coffee beans", "Soybeans", "Vanilla beans"]),
  fact("food", "Olive oil", "Olive oil is produced by pressing olives.", "Food production reference", "Olive oil is produced from what fruit?", "Olives", ["Grapes", "Dates", "Apples"]),
  fact("food", "Bread", "Bread is commonly made from flour, water, and yeast or another leavening method.", "Food reference", "Bread is commonly made from flour, water, and what?", "Yeast or another leavening method", ["Copper", "Saltwater fish", "Glass"]),

  fact("languages", "Mandarin Chinese", "Mandarin Chinese is the language with the largest number of native speakers.", "Ethnologue language reference", "Which language has the largest number of native speakers?", "Mandarin Chinese", ["English", "Spanish", "Arabic"]),
  fact("languages", "Arabic", "Arabic is written from right to left.", "Language reference", "Arabic is written in which direction?", "Right to left", ["Left to right", "Top to bottom only", "Bottom to top"]),
  fact("languages", "English", "Modern English uses the Latin alphabet.", "Language reference", "Modern English uses which alphabet?", "Latin alphabet", ["Cyrillic alphabet", "Greek alphabet", "Hangul"]),
  fact("languages", "Spanish", "Spanish is a Romance language.", "Language reference", "Spanish belongs to which language family group?", "Romance language", ["Germanic language", "Slavic language", "Sino-Tibetan language"])
];

const EXACT_COUNT = 250000;
const CATEGORY_DEFS = [
  { id: "all", label: "All Categories", count: 0 },
  { id: "geography", label: "Geography", count: countReal("geography") },
  { id: "countries", label: "Countries", count: countReal("countries") },
  { id: "history", label: "History", count: countReal("history") },
  { id: "space", label: "Space", count: countReal("space") },
  { id: "governments", label: "Governments", count: countReal("governments") },
  { id: "world-records", label: "World Records", count: countReal("world-records") },
  { id: "money", label: "Money", count: countReal("money") },
  { id: "science-tech", label: "Science + Tech", count: countReal("science-tech") },
  { id: "animals", label: "Animals", count: countReal("animals") },
  { id: "plants", label: "Plants", count: countReal("plants") },
  { id: "oceans", label: "Oceans", count: countReal("oceans") },
  { id: "climate", label: "Climate", count: countReal("climate") },
  { id: "inventions", label: "Inventions", count: countReal("inventions") },
  { id: "arts-culture", label: "Arts + Culture", count: countReal("arts-culture") },
  { id: "sports", label: "Sports", count: countReal("sports") },
  { id: "health", label: "Health", count: countReal("health") },
  { id: "food", label: "Food", count: countReal("food") },
  { id: "languages", label: "Languages", count: countReal("languages") },
  { id: "exact-reference", label: "Exact Reference", count: EXACT_COUNT }
];

const PAGE_SIZE = 72;
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

CATEGORY_DEFS[0].count = CATEGORY_DEFS.slice(1).reduce((sum, category) => sum + category.count, 0);

function fact(category, topic, text, source, question, answer, distractors) {
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

function countReal(category) {
  return REAL_FACTS.filter((item) => item.category === category).length;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function categoryLabel(categoryId) {
  return CATEGORY_DEFS.find((category) => category.id === categoryId)?.label || categoryId;
}

function exactFact(index) {
  const group = index % 6;
  const n = Math.floor(index / 6) + 1;

  if (group === 0) {
    const a = (n % 144) + 1;
    const b = (Math.floor(n / 144) % 144) + 1;
    return generatedFact("Arithmetic", `${a} x ${b} = ${formatNumber(a * b)}.`, "Computed by integer multiplication.", `${a} x ${b} = ?`, String(a * b), [String(a * (b + 1)), String((a + 1) * b), String(a * b + a)]);
  }
  if (group === 1) {
    return generatedFact("Number Properties", `${n} squared is ${formatNumber(n * n)}.`, "Computed from the definition of square numbers.", `${n} squared equals what?`, String(n * n), [String(n * 2), String(n * n + n), String(n + 2)]);
  }
  if (group === 2) {
    const isEven = n % 2 === 0;
    return generatedFact("Number Properties", `${n} is ${isEven ? "even" : "odd"}.`, "Computed from divisibility by 2.", `Is ${n} even?`, isEven ? "Yes" : "No", [isEven ? "No" : "Yes", "Only when squared", "Cannot tell"]);
  }
  if (group === 3) {
    const amount = n;
    return generatedFact("Exact Measurement", `${formatNumber(amount)} hours = ${formatNumber(amount * 60)} minutes.`, "One hour is defined as 60 minutes.", `${amount} hours equals how many minutes?`, String(amount * 60), [String(amount * 30), String(amount * 100), String(amount * 60 + 10)]);
  }
  if (group === 4) {
    return generatedFact("Geometry", `A square with side length ${n} has area ${formatNumber(n * n)}.`, "Computed from area = side x side.", `What is the area of a square with side length ${n}?`, String(n * n), [String(4 * n), String(n + n), String(n * n + n)]);
  }
  const year = 1600 + (n % 500);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return generatedFact("Gregorian Calendar", `${year} is ${leap ? "" : "not "}a Gregorian leap year.`, "Uses the Gregorian leap-year rule.", `Is ${year} a Gregorian leap year?`, leap ? "Yes" : "No", [leap ? "No" : "Yes", "Only in February", "Every century year"]);
}

function generatedFact(topic, text, proof, question, answer, distractors) {
  return {
    category: "exact-reference",
    topic,
    text,
    proof,
    url: "",
    question,
    answer,
    distractors
  };
}

function searchableText(item) {
  return `${item.text} ${item.topic} ${item.proof} ${categoryLabel(item.category)} ${item.question || ""}`.toLowerCase();
}

function realFactsForState() {
  if (state.category === "exact-reference") return [];
  const facts = state.category === "all"
    ? REAL_FACTS
    : REAL_FACTS.filter((item) => item.category === state.category);
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

function shouldIncludeExact() {
  if (state.category === "exact-reference") return true;
  if (state.category !== "all") return false;
  if (!state.search) return true;
  return /\d|multiply|times|square|squared|even|odd|hour|minute|area|geometry|leap|gregorian|calendar|meter|centimeter|prefix|kilo|milli/.test(state.search);
}

function exactMatchesSearch(item) {
  return !state.search || searchableText(item).includes(state.search);
}

function countExactVisible() {
  if (!shouldIncludeExact()) return 0;
  if (!state.search) return EXACT_COUNT;
  let count = 0;
  for (let index = 0; index < EXACT_COUNT; index += 1) {
    if (exactMatchesSearch(exactFact(index))) count += 1;
  }
  return count;
}

function getExactPage(limit, offset) {
  const rows = [];
  if (!shouldIncludeExact() || limit <= 0) return rows;

  if (!state.search) {
    const end = Math.min(EXACT_COUNT, offset + limit);
    for (let index = offset; index < end; index += 1) rows.push(exactFact(index));
    return rows;
  }

  let skipped = 0;
  for (let index = 0; index < EXACT_COUNT; index += 1) {
    const item = exactFact(index);
    if (!exactMatchesSearch(item)) continue;
    if (skipped < offset) {
      skipped += 1;
      continue;
    }
    rows.push(item);
    if (rows.length >= limit) return rows;
  }
  return rows;
}

function getVisibleCountAndPage() {
  const realFacts = realFactsForState();
  const exactCount = countExactVisible();
  const visibleCount = realFacts.length + exactCount;
  const start = state.page * PAGE_SIZE;
  const pageFacts = [];

  if (start < realFacts.length) {
    pageFacts.push(...realFacts.slice(start, start + PAGE_SIZE));
  }

  if (pageFacts.length < PAGE_SIZE) {
    const exactOffset = Math.max(0, start - realFacts.length);
    pageFacts.push(...getExactPage(PAGE_SIZE - pageFacts.length, exactOffset));
  }

  return { visibleCount, pageFacts };
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
  const firstPass = getVisibleCountAndPage();
  const visibleCount = firstPass.visibleCount;
  const maxPage = Math.max(0, Math.ceil(visibleCount / PAGE_SIZE) - 1);
  state.page = Math.min(state.page, maxPage);
  const { pageFacts } = getVisibleCountAndPage();

  els.totalFacts.textContent = formatNumber(CATEGORY_DEFS[0].count);
  els.visibleFacts.textContent = formatNumber(visibleCount);
  els.sectionTitle.textContent = categoryLabel(state.category);
  els.sectionMeta.textContent = state.search
    ? `Source-backed entries filtered by "${state.search}"`
    : state.sort === "default"
      ? "Real-world facts are source-labeled; exact generated facts are formula-based."
      : `Organized by ${els.sortSelect.options[els.sortSelect.selectedIndex].textContent}. Exact Reference stays generated for speed.`;
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
  const realPool = realFactsForState().filter((item) => item.question && item.answer && item.distractors?.length >= 3);
  const pool = realPool.length ? realPool : getExactPage(200, 0).filter((item) => item.question && item.answer && item.distractors?.length >= 3);
  const fallback = REAL_FACTS.filter((item) => item.question);
  const item = (pool.length ? pool : fallback)[Math.floor(Math.random() * (pool.length ? pool.length : fallback.length))];
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
  const barWidth = width / cats.length - 10;
  cats.forEach((category, index) => {
    const barHeight = Math.max(8, (category.count / max) * (height - 54));
    const x = index * (barWidth + 10) + 8;
    const y = height - barHeight - 28;
    ctx.fillStyle = category.id === state.category || state.category === "all" ? accent : line;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = ink;
    ctx.font = "700 10px system-ui";
    ctx.save();
    ctx.translate(x + 2, height - 8);
    ctx.rotate(-Math.PI / 5);
    ctx.fillText(category.label.split(" ")[0], 0, 0);
    ctx.restore();
  });

  els.mapLabel.textContent = categoryLabel(state.category);
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

els.sortSelect.addEventListener("change", () => {
  state.sort = els.sortSelect.value;
  state.page = 0;
  renderFacts();
  if (state.mode === "quiz") newQuestion();
});

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const isDark = theme === "dark";
  els.themeToggle.textContent = isDark ? "Light" : "Dark";
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("factforge-theme", theme);
  drawKnowledgeMap();
}

els.themeToggle.addEventListener("click", () => {
  applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
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
