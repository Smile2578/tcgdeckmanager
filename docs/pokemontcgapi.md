Authentication
The Pokémon TCG API uses API keys to authenticate requests. Sign up for an account at the Pokémon TCG Developer Portal to get your API key for free.

Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth. If you feel as though your API key has been compromised, you can generate a new key at any time.

Authentication to the API is performed via the X-Api-Key header. Provide your API key in the headers of all requests to authenticate to the Pokémon TCG API.

All API requests must be made over HTTPS. Calls made over plain HTTP will fail will redirect to HTTPS automatically. API requests without authentication won't fail, but your rate limits are drastically reduced.

Rate Limits
Overview#
Rate limits are enforced for all third-party applications and services. This document is an overview of the rate limits themselves, as well as how they are enforced and best practices for handling the errors returned when a rate limit is reached.

V2 Rate Limits#
Third-party application rate limits depend on your API key. By default, requests are limited to 20,000/day. If you need a higher rate limit, feel free to contact me via Discord or email and we can discuss.

If you aren’t using an API key, you are rate limited to 1000 requests a day, and a maxium of 30 per minute.

V1 (Deprecated) Rate Limits#
Third-party applications are currently throttled to 30 requests per minute. As this API continues to age, the rate limits may be updated to provide better performance to users

Rationale#
As previously mentioned, the primary goal is to provide a responsive interface for developers and users to use when accessing the Pokémon TCG data. Since each request made to the API incurs a computational cost, it’s in the best interest of both the Pokémon TCG API and its developer partners that these costs be minimized to the greatest degree possible.

Rate limiting also helps third-party developers by encouraging them to build their integrations to make economical use of API requests.

By donating to this API via Patreon or Kofi, you can help ensure that the server performance will meet your application needs.

Errors
The Pokémon TCG API uses conventional HTTP response codes to indicate the success or failure of an API request. In general: Codes in the 200 range indicate success. Codes in the 4xx range indicate an error that failed given the information provided (e.g., a required parameter was omitted). Codes in the 5xx range indicate an error with the Pokémon TCG API servers.

HTTP Status Code Summary#
Status Code	Description
200 - OK	Everything worked as expected.
400 - Bad Request	The request was unacceptable, often due to an incorrect query string parameter
402 - Request Failed	The parameters were valid but the request failed.
403 - Forbidden	The user doesn't have permissions to perform the request.
404 - Not Found	The requested resource doesn't exist.
429 - Too Many Requests	The rate limit has been exceeded.
500, 502, 503, 504 - Server Errors	Something went wrong on our end.


The card object
Attributes#
id string#
Unique identifier for the object.

name string#
The name of the card.

supertype string#
The supertype of the card, such as Pokémon, Energy, or Trainer.

subtypes list(string)#
A list of subtypes, such as Basic, EX, Mega, Rapid Strike, etc.

level string#
The level of the card. This only pertains to cards from older sets and those of supertype Pokémon.

hp string#
The hit points of the card.

types list(string)#
The energy types for a card, such as Fire, Water, Grass, etc.

evolvesFrom string#
Which Pokémon this card evolves from.

evolvesTo list(string)#
Which Pokémon this card evolves to. Can be multiple, for example, Eevee.

rules list(string)#
Any rules associated with the card. For example, VMAX rules, Mega rules, or various trainer rules.

ancientTrait hash#
The ancient trait for a given card. An ancient trait has the following fields:

Property	Description
name string	The name of the ancient trait
text string	The text value of the ancient trait
abilities list(hash)#
One or more abilities for a given card. An ability has the following fields:

Property	Description
name string	The name of the ability
text string	The text value of the ability
type string	The type of the ability, such as Ability or Pokémon-Power
attacks list(hash)#
One or more attacks for a given card. An attack has the following fields:

Property	Description
cost list(string)	The cost of the attack represented by a list of energy types.
name string	The name of the attack
text string	The text or description associated with the attack
damage string	The damage amount of the attack
convertedEnergyCost integer	The total cost of the attack. For example, if it costs 2 fire energy, the converted energy cost is simply 2.
weaknesses list(hash)#
One or more weaknesses for a given card. A weakness has the following fields:

Property	Description
type string	The type of weakness, such as Fire or Water.
value string	The value of the weakness
resistances list(hash)#
One or more resistances for a given card. A resistance has the following fields:

Property	Description
type string	The type of resistance, such as Fire or Water.
value string	The value of the resistance
retreatCost list(string)#
A list of costs it takes to retreat and return the card to your bench. Each cost is an energy type, such as Water or Fire.

convertedRetreatCost integer#
The converted retreat cost for a card is the count of energy types found within the retreatCost field. For example, ["Fire", "Water"] has a converted retreat cost of 2.

set hash#
The set details embedded into the card. See the set object for more details.

number string#
The number of the card.

artist string#
The artist of the card.

rarity string#
The rarity of the card, such as "Common" or "Rare Rainbow".

flavorText string#
The flavor text of the card. This is the text that can be found on some Pokémon cards that is usually italicized near the bottom of the card.

nationalPokedexNumbers list(integer)#
The national pokedex numbers associated with any Pokémon featured on a given card.

legalities hash#
The legalities for a given card. A legality will not be present in the hash if it is not legal. If it is legal or banned, it will be present.

Property	Description
standard string	The legality ruling for Standard. Can be either Legal, Banned, or not present.
expanded string	The legality ruling for Expanded. Can be either Legal, Banned, or not present.
unlimited string	The legality ruling for Unlimited. Can be either Legal, Banned, or not present.
regulationMark string#
A letter symbol found on each card that identifies whether it is legal to use in tournament play. Regulation marks were introduced on cards in the Sword & Shield Series.

images hash#
The images for a card.

Property	Description
small string	A smaller, lower-res image for a card. This is a URL.
large string	A larger, higher-res image for a card. This is a URL.
tcgplayer hash#
The TCGPlayer information for a given card. ALL PRICES ARE IN US DOLLARS.

Property	Description
url string	The URL to the TCGPlayer store page to purchase this card.
updatedAt string	A date that the price was last updated. In the format of YYYY/MM/DD
prices hash	A hash of price types. All prices are in US Dollars. See below for possible values.
The following price types are available:

normal, holofoil, reverseHolofoil, 1stEditionHolofoil and 1stEditionNormal.

Each price type can have the following fields (all provided via TCGPlayer):

Property	Description
low decimal	The low price of the card
mid decimal	The mid price of the card
high decimal	The high price of the card
market decimal	The market value of the card. This is usually the best representation of what people are willing to pay.
directLow decimal	The direct low price of the card
cardmarket hash#
The cardmarket information for a given card. ALL PRICES ARE IN EUROS.

Property	Description
url string	The URL to the cardmarket store page to purchase this card.
updatedAt string	A date that the price was last updated. In the format of YYYY/MM/DD
prices hash	A hash of price types. All prices are in Euros. See below for possible values.
The following prices are provided by cardmarket and made available via this API:

Property	Description
averageSellPrice decimal	The average sell price as shown in the chart at the website for non-foils
lowPrice decimal	The lowest price at the market for non-foils
trendPrice decimal	The trend price as shown at the website (and in the chart) for non-foils
germanProLow decimal	The lowest sell price from German professional sellers
suggestedPrice decimal	A suggested sell price for professional users, determined by an internal algorithm; this algorithm is controlled by cardmarket, not this API
reverseHoloSell decimal	The average sell price as shown in the chart at the website for reverse holos
reverseHoloLow decimal	The lowest price at the market as shown at the website (for condition EX+) for reverse holos
reverseHoloTrend decimal	The trend price as shown at the website (and in the chart) for reverse holos
lowPriceExPlus decimal	The lowest price at the market for non-foils with condition EX or better
avg1 decimal	The average sale price over the last day
avg7 decimal	The average sale price over the last 7 days
avg30 decimal	The average sale price over the last 30 days
reverseHoloAvg1 decimal	The average sale price over the last day for reverse holos
reverseHoloAvg7 decimal	The average sale price over the last 7 days for reverse holos
reverseHoloAvg30 decimal	The average sale price over the last 30 days for reverse holos
Sample JSON#
{
  "id": "swsh4-25",
  "name": "Charizard",
  "supertype": "Pokémon",
  "subtypes": [
    "Stage 2"
  ],
  "hp": "170",
  "types": [
    "Fire"
  ],
  "evolvesFrom": "Charmeleon",
  "abilities": [
    {
      "name": "Battle Sense",
      "text": "Once during your turn, you may look at the top 3 cards of your deck and put 1 of them into your hand. Discard the other cards.",
      "type": "Ability"
    }
  ],
  "attacks": [
    {
      "name": "Royal Blaze",
      "cost": [
        "Fire",
        "Fire"
      ],
      "convertedEnergyCost": 2,
      "damage": "100+",
      "text": "This attack does 50 more damage for each Leon card in your discard pile."
    }
  ],
  "weaknesses": [
    {
      "type": "Water",
      "value": "×2"
    }
  ],
  "retreatCost": [
    "Colorless",
    "Colorless",
    "Colorless"
  ],
  "convertedRetreatCost": 3,
  "set": {
    "id": "swsh4",
    "name": "Vivid Voltage",
    "series": "Sword & Shield",
    "printedTotal": 185,
    "total": 203,
    "legalities": {
      "unlimited": "Legal",
      "standard": "Legal",
      "expanded": "Legal"
    },
    "ptcgoCode": "VIV",
    "releaseDate": "2020/11/13",
    "updatedAt": "2020/11/13 16:20:00",
    "images": {
      "symbol": "https://images.pokemontcg.io/swsh4/symbol.png",
      "logo": "https://images.pokemontcg.io/swsh4/logo.png"
    }
  },
  "number": "25",
  "artist": "Ryuta Fuse",
  "rarity": "Rare",
  "flavorText": "It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames.",
  "nationalPokedexNumbers": [
    6
  ],
  "legalities": {
    "unlimited": "Legal",
    "standard": "Legal",
    "expanded": "Legal"
  },
  "images": {
    "small": "https://images.pokemontcg.io/swsh4/25.png",
    "large": "https://images.pokemontcg.io/swsh4/25_hires.png"
  },
  "tcgplayer": {
    "url": "https://prices.pokemontcg.io/tcgplayer/swsh4-25",
    "updatedAt": "2021/08/04",
    "prices": {
      "normal": {
        "low": 1.73,
        "mid": 3.54,
        "high": 12.99,
        "market": 2.82,
        "directLow": 3.93
      },
      "reverseHolofoil": {
        "low": 3,
        "mid": 8.99,
        "high": 100,
        "market": 3.89,
        "directLow": 4.46
      }
    }
  },
  "cardmarket": {
    "url": "https://prices.pokemontcg.io/cardmarket/swsh4-25",
    "updatedAt": "2021/08/04",
    "prices": {
      "averageSellPrice": 9.38,
      "lowPrice": 8.95,
      "trendPrice": 10.29,
      "germanProLow": null,
      "suggestedPrice": null,
      "reverseHoloSell": null,
      "reverseHoloLow": null,
      "reverseHoloTrend": null,
      "lowPriceExPlus": 8.95,
      "avg1": 9.95,
      "avg7": 9.35,
      "avg30": 11.31,
      "reverseHoloAvg1": null,
      "reverseHoloAvg7": null,
      "reverseHoloAvg30": null
    }
  }
}

Get a card
Fetch the details of a single card.

HTTP Request#
GET https://api.pokemontcg.io/v2/cards/<id>
URL Parameters#
Parameter	Description
id	The Id of the card
Body Parameters#
None

Query Parameters#
All query parameters are optional.

Parameter	Description	Default Value
select	A comma delimited list of fields to return in the response (ex. ?select=id,name). By default, all fields are returned if this query parameter is not used.	
Code Samples#
Python
Ruby
Javascript
cURL
pokemon.card.find('base1-4')
.then(card => {
    console.log(card.name) // "Charizard"
})
Sample Response#
{
  "data": {
    "id": "xy1-1",
    "name": "Venusaur-EX",
    "supertype": "Pokémon",
    "subtypes": [
      "Basic",
      "EX"
    ],
    "hp": "180",
    "types": [
      "Grass"
    ],
    "evolvesTo": [
      "M Venusaur-EX"
    ],
    "rules": [
      "Pokémon-EX rule: When a Pokémon-EX has been Knocked Out, your opponent takes 2 Prize cards."
    ],
    "attacks": [
      {
        "name": "Poison Powder",
        "cost": [
          "Grass",
          "Colorless",
          "Colorless"
        ],
        "convertedEnergyCost": 3,
        "damage": "60",
        "text": "Your opponent's Active Pokémon is now Poisoned."
      },
      {
        "name": "Jungle Hammer",
        "cost": [
          "Grass",
          "Grass",
          "Colorless",
          "Colorless"
        ],
        "convertedEnergyCost": 4,
        "damage": "90",
        "text": "Heal 30 damage from this Pokémon."
      }
    ],
    "weaknesses": [
      {
        "type": "Fire",
        "value": "×2"
      }
    ],
    "retreatCost": [
      "Colorless",
      "Colorless",
      "Colorless",
      "Colorless"
    ],
    "convertedRetreatCost": 4,
    "set": {
      "id": "xy1",
      "name": "XY",
      "series": "XY",
      "printedTotal": 146,
      "total": 146,
      "legalities": {
        "unlimited": "Legal",
        "expanded": "Legal"
      },
      "ptcgoCode": "XY",
      "releaseDate": "2014/02/05",
      "updatedAt": "2018/03/04 10:35:00",
      "images": {
        "symbol": "https://images.pokemontcg.io/xy1/symbol.png",
        "logo": "https://images.pokemontcg.io/xy1/logo.png"
      }
    },
    "number": "1",
    "artist": "Eske Yoshinob",
    "rarity": "Rare Holo EX",
    "nationalPokedexNumbers": [
      3
    ],
    "legalities": {
      "unlimited": "Legal",
      "expanded": "Legal"
    },
    "images": {
      "small": "https://images.pokemontcg.io/xy1/1.png",
      "large": "https://images.pokemontcg.io/xy1/1_hires.png"
    },
    "tcgplayer": {
      "url": "https://prices.pokemontcg.io/tcgplayer/xy1-1",
      "updatedAt": "2021/07/09",
      "prices": {
        "holofoil": {
          "low": 1.0,
          "mid": 3.46,
          "high": 12.95,
          "market": 3.32,
          "directLow": 2.95
        }
      }
    }
  }
}

Search cards
Search for one or many cards given a search query.

HTTP Request#
GET https://api.pokemontcg.io/v2/cards
URL Parameters#
None

Body Parameters#
None

Query Parameters#
All query parameters are optional.

Parameter	Description	Default Value
q	The search query. Examples can be found below.	
page	The page of data to access.	1
pageSize	The maximum amount of cards to return.	250 (max of 250)
orderBy	The field(s) to order the results by. Examples can be found below.	
select	A comma delimited list of fields to return in the response (ex. ?select=id,name). By default, all fields are returned if this query parameter is not used.	
To perform search queries, you use the q parameter. The search syntax is a very familiar Lucene like syntax.

Keyword matching:#
Search for all cards that have "charizard" in the name field.

name:charizard
Search for the phrase "venusaur v" in the name field.

name:"venusaur v"
Search for "charizard" in the name field AND the type "mega" in the subtypes field.

name:charizard subtypes:mega
Search for "charizard" in the name field AND either the subtypes of "mega" or "vmax."

name:charizard (subtypes:mega OR subtypes:vmax)
Search for all "mega" subtypes, but NOT water types.

subtypes:mega -types:water
Wildcard Matching#
Search for any card that starts with "char" in the name field.

name:char*
Search for any card that starts with "char" in the name and ends with "der."

name:char*der
Exact Matching#
Search for any card named "charizard." That is, no other word except for "charizard" appears in the name field.

!name:charizard
Range Searches#
Some fields support searching on a range. This includes fields with numerical data like hp and nationalPokedexNumbers.

Search for only cards that feature the original 151 pokemon.

nationalPokedexNumbers:[1 TO 151]
Using square brackets [ and ] means to do an inclusive range search, while using curly braces { and } means exclusive.

Search for cards with a max HP up to 100.

hp:[* TO 100]
Search for cards with any HP greater than or equal to 150.

hp:[150 TO *]
Search on nested fields#
To search nested fields, use a period . as a separator. For example, to filter by the set id:

set.id:sm1
Or to filter on cards where they have an attack named "Spelunk":

attacks.name:Spelunk
Find cards that are banned in Standard.

legalities.standard:banned
Every field in the response is searchable.

Ordering Data#
You can also order data using the orderBy query parameter.

Order all cards from Sun & Moon by their number.

?orderBy=number
Order all cards from Sun & Moon by their name (ascending) and then their number (descending)

?orderBy=name,-number
Code Samples#
Python
Ruby
Javascript
cURL
// Get all cards (will take awhile, automatically pages through data)
pokemon.card.all()
  .then((cards) => {
      console.log(cards[0].name) // "Blastoise"
  })

// Get a single page of cards
pokemon.card.where({ pageSize: 250, page: 1 })
  .then(result => {
      console.log(result.data[0].name) // "Blastoise"
  })

// Filter cards via query parameters
pokemon.card.all({ q: 'set.name:generations subtypes:mega' })
  .then(result => {
      console.log(result.data[0].name) // "Venusaur"
  })

// Order by release date (descending)
pokemon.card.all({ q: 'subtypes:mega', orderBy: '-set.releaseDate' })
  .then(result => {
      console.log(result.data[0].name)
  })
Sample Response#
{
  "data": [
    {
      "id": "g1-1",
      "name": "Venusaur-EX",
      "supertype": "Pokémon",
      "subtypes": [
        "Basic",
        "EX"
      ],
      "hp": "180",
      "types": [
        "Grass"
      ],
      "evolvesTo": [
        "M Venusaur-EX"
      ],
      "rules": [
        "Pokémon-EX rule: When a Pokémon-EX has been Knocked Out, your opponent takes 2 Prize cards."
      ],
      "attacks": [
        {
          "name": "Frog Hop",
          "cost": [
            "Grass",
            "Colorless",
            "Colorless"
          ],
          "convertedEnergyCost": 3,
          "damage": "40+",
          "text": "Flip a coin. If heads, this attack does 40 more damage."
        },
        {
          "name": "Poison Impact",
          "cost": [
            "Grass",
            "Grass",
            "Colorless",
            "Colorless"
          ],
          "convertedEnergyCost": 4,
          "damage": "80",
          "text": "Your opponent's Active Pokémon is now Asleep and Poisoned."
        }
      ],
      "weaknesses": [
        {
          "type": "Fire",
          "value": "×2"
        }
      ],
      "retreatCost": [
        "Colorless",
        "Colorless",
        "Colorless",
        "Colorless"
      ],
      "convertedRetreatCost": 4,
      "set": {
        "id": "g1",
        "name": "Generations",
        "series": "XY",
        "printedTotal": 115,
        "total": 115,
        "legalities": {
          "unlimited": "Legal",
          "expanded": "Legal"
        },
        "ptcgoCode": "GEN",
        "releaseDate": "2016/02/22",
        "updatedAt": "2020/08/14 09:35:00",
        "images": {
          "symbol": "https://images.pokemontcg.io/g1/symbol.png",
          "logo": "https://images.pokemontcg.io/g1/logo.png"
        }
      },
      "number": "1",
      "artist": "Eske Yoshinob",
      "rarity": "Rare Holo EX",
      "nationalPokedexNumbers": [
        3
      ],
      "legalities": {
        "unlimited": "Legal",
        "expanded": "Legal"
      },
      "images": {
        "small": "https://images.pokemontcg.io/g1/1.png",
        "large": "https://images.pokemontcg.io/g1/1_hires.png"
      },
      "tcgplayer": {
        "url": "https://prices.pokemontcg.io/tcgplayer/g1-1",
        "updatedAt": "2021/07/15",
        "prices": {
          "holofoil": {
            "low": 2.44,
            "mid": 5.4,
            "high": 16.99,
            "market": 5.38,
            "directLow": 6.1
          }
        }
      }
    },
    {...},
    {...}
  ],
  "page": 1,
  "pageSize": 250,
  "count": 117,
  "totalCount": 117
}


The set object
Attributes#
id string#
Unique identifier for the object.

name string#
The name of the set.

series string#
The series the set belongs to, like Sword and Shield or Base.

printedTotal integer#
The number printed on the card that represents the total. This total does not include secret rares.

total integer#
The total number of cards in the set, including secret rares, alternate art, etc.

legalities hash#
The legalities of the set. If a given format is not legal, it will not appear in the hash. This is a hash with the following fields:

Property	Description
standard string	The standard game format. Possible values are Legal.
expanded string	The expanded game format. Possible values are Legal.
unlimited string	The unlimited game format. Possible values are Legal.
ptcgoCode string#
The code the Pokémon Trading Card Game Online uses to identify a set.

releaseDate string#
The date the set was released (in the USA). Format is YYYY/MM/DD.

updatedAt string#
The date and time the set was updated. Format is YYYY/MM/DD HH:MM:SS.

images hash#
Any images associated with the set, such as symbol and logo. This is a hash with the following fields:

Property	Description
symbol string	The url to the symbol image.
logo string	The url to the logo image.
Sample JSON#
{
    "id": "swsh1",
    "name": "Sword & Shield",
    "series": "Sword & Shield",
    "printedTotal": 202,
    "total": 216,
    "legalities": {
        "unlimited": "Legal",
        "standard": "Legal",
        "expanded": "Legal"
    },
    "ptcgoCode": "SSH",
    "releaseDate": "2020/02/07",
    "updatedAt": "2020/08/14 09:35:00",
    "images": {
        "symbol": "https://images.pokemontcg.io/swsh1/symbol.png",
        "logo": "https://images.pokemontcg.io/swsh1/logo.png"
    }
}

Get a set
Fetch the details of a single set.

HTTP Request#
GET https://api.pokemontcg.io/v2/sets/<id>
URL Parameters#
Parameter	Description
id	The Id of the set
Body Parameters#
None

Query Parameters#
Parameter	Description	Default Value
select	A comma delimited list of fields to return in the response (ex. ?select=id,name). By default, all fields are returned if this query parameter is not used.	
Code Samples#
Python
Ruby
Javascript
cURL
pokemon.set.find('swsh1')
.then(set => {
    console.log(set.name) // "Sword & Shield"
})
Sample Response#
{
  "data": {
    "id": "swsh1",
    "name": "Sword & Shield",
    "series": "Sword & Shield",
    "printedTotal": 202,
    "total": 216,
    "legalities": {
      "unlimited": "Legal",
      "standard": "Legal",
      "expanded": "Legal"
    },
    "ptcgoCode": "SSH",
    "releaseDate": "2020/02/07",
    "updatedAt": "2020/08/14 09:35:00",
    "images": {
      "symbol": "https://images.pokemontcg.io/swsh1/symbol.png",
      "logo": "https://images.pokemontcg.io/swsh1/logo.png"
    }
  }
}

Search sets
Search for one or many sets given a search query.

HTTP Request#
GET https://api.pokemontcg.io/v2/sets
URL Parameters#
None

Body Parameters#
None

Query Parameters#
All query parameters are optional.

Parameter	Description	Default Value
q	The search query. Examples can be found below.	
page	The page of data to access.	1
pageSize	The maximum amount of cards to return.	250 (max of 250)
orderBy	The field(s) to order the results by. Examples can be found below.	
select	A comma delimited list of fields to return in the response (ex. ?select=id,name). By default, all fields are returned if this query parameter is not used.	
Look at the /cards endpoint for more details on the advanced query syntax.

Code Samples#
Python
Ruby
Javascript
cURL
// Get all sets
pokemon.set.all()
  .then((sets) => {
      console.log(sets[0].name) // "Base"
  })

// Filter sets
pokemon.set.where({ q: 'legalities.standard:legal' })
  .then(result => {
      console.log(result.data[0].name)
  })

// Get specific page of data
pokemon.set.where({ pageSize: 10, page: 2 })
  .then(result => {
      console.log(result.data[0].name)
  })
Sample Response#
{
  "data": [
    {
      "id": "base1",
      "name": "Base",
      "series": "Base",
      "printedTotal": 102,
      "total": 102,
      "legalities": {
        "unlimited": "Legal"
      },
      "ptcgoCode": "BS",
      "releaseDate": "1999/01/09",
      "updatedAt": "2020/08/14 09:35:00",
      "images": {
        "symbol": "https://images.pokemontcg.io/base1/symbol.png",
        "logo": "https://images.pokemontcg.io/base1/logo.png"
      }
    },
    {...},
    {...}
  ],
  "page": 1,
  "pageSize": 250,
  "count": 123,
  "totalCount": 123
}

HTTP Request#
GET https://api.pokemontcg.io/v2/types
URL Parameters#
None

Body Parameters#
None

Query Parameters#
None

Code Samples#
Python
Ruby
Javascript
cURL
pokemon.type.all()
Sample Response#
{
  "data": [
    "Colorless",
    "Darkness",
    "Dragon",
    "Fairy",
    "Fighting",
    "Fire",
    "Grass",
    "Lightning",
    "Metal",
    "Psychic",
    "Water"
  ]
}

Get subtypes
Get all possible subtypes

HTTP Request#
GET https://api.pokemontcg.io/v2/subtypes
URL Parameters#
None

Body Parameters#
None

Query Parameters#
None

Code Samples#
Python
Ruby
Javascript
cURL
pokemon.subtype.all()
Sample Response#
{
  "data": [
    "BREAK",
    "Baby",
    "Basic",
    "EX",
    "GX",
    "Goldenrod Game Corner",
    "Item",
    "LEGEND",
    "Level-Up",
    "MEGA",
    "Pokémon Tool",
    "Pokémon Tool F",
    "Rapid Strike",
    "Restored",
    "Rocket's Secret Machine",
    "Single Strike",
    "Special",
    "Stadium",
    "Stage 1",
    "Stage 2",
    "Supporter",
    "TAG TEAM",
    "Technical Machine",
    "V",
    "VMAX"
  ]
}

Get supertypes
Get all possible supertypes

HTTP Request#
GET https://api.pokemontcg.io/v2/supertypes
URL Parameters#
None

Body Parameters#
None

Query Parameters#
None

Code Samples#
Python
Ruby
Javascript
cURL
pokemon.supertype.all()
Sample Response#
{
  "data": [
    "Energy",
    "Pokémon",
    "Trainer"
  ]
}

Get rarities
Get all possible rarities

HTTP Request#
GET https://api.pokemontcg.io/v2/rarities
URL Parameters#
None

Body Parameters#
None

Query Parameters#
None

Code Samples#
Python
Ruby
Javascript
cURL
pokemon.rarity.all()
Sample Response#
{
  "data": [
      "Amazing Rare",
      "Common",
      "LEGEND",
      "Promo",
      "Rare",
      "Rare ACE",
      "Rare BREAK",
      "Rare Holo",
      "Rare Holo EX",
      "Rare Holo GX",
      "Rare Holo LV.X",
      "Rare Holo Star",
      "Rare Holo V",
      "Rare Holo VMAX",
      "Rare Prime",
      "Rare Prism Star",
      "Rare Rainbow",
      "Rare Secret",
      "Rare Shining",
      "Rare Shiny",
      "Rare Shiny GX",
      "Rare Ultra",
      "Uncommon"
  ]
}

