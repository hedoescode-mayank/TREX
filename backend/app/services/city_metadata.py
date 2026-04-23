"""
City Metadata — state, population, region, description for all 54 Indian cities.
Used for hero sections and city cards.
"""

CITY_META = {
    "Mumbai": {
        "state": "Maharashtra", "region": "West India", "type": "Metro",
        "population": "2.1 Cr",
        "desc": "Financial capital of India, home to Bollywood and the world's busiest suburban rail network.",
    },
    "Delhi": {
        "state": "Delhi NCR", "region": "North India", "type": "Metro",
        "population": "1.9 Cr (city)",
        "desc": "India's capital — a political and cultural nerve centre with ancient monuments and modern infrastructure.",
    },
    "Bangalore": {
        "state": "Karnataka", "region": "South India", "type": "Metro",
        "population": "1.3 Cr",
        "desc": "India's Silicon Valley. Global tech hub with a thriving startup ecosystem and a pleasant year-round climate.",
    },
    "Chennai": {
        "state": "Tamil Nadu", "region": "South India", "type": "Metro",
        "population": "0.9 Cr",
        "desc": "Gateway to South India. A cultural and automobile manufacturing hub with a strong Tamil identity.",
    },
    "Hyderabad": {
        "state": "Telangana", "region": "South India", "type": "Metro",
        "population": "1.0 Cr",
        "desc": "City of Pearls and Biryani. A fast-growing tech and pharma hub with relatively affordable living.",
    },
    "Pune": {
        "state": "Maharashtra", "region": "West India", "type": "Metro",
        "population": "0.5 Cr",
        "desc": "Oxford of the East. Major IT, education, and automobile centre with a vibrant young culture.",
    },
    "Kolkata": {
        "state": "West Bengal", "region": "East India", "type": "Metro",
        "population": "1.4 Cr",
        "desc": "Cultural capital of India. Known for intellectual heritage, colonial architecture, and affordable living.",
    },
    "Ahmedabad": {
        "state": "Gujarat", "region": "West India", "type": "Tier 1",
        "population": "0.8 Cr",
        "desc": "Business capital of Gujarat. A fast-developing city with strong manufacturing and textile industries.",
    },
    "Jaipur": {
        "state": "Rajasthan", "region": "North India", "type": "Tier 1",
        "population": "0.4 Cr",
        "desc": "The Pink City. A major tourism and heritage hub with a growing IT and manufacturing presence.",
    },
    "Lucknow": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Tier 1",
        "population": "0.37 Cr",
        "desc": "City of Nawabs. Known for Awadhi cuisine, cultural refinement, and a very affordable cost of living.",
    },
    "Gurgaon": {
        "state": "Haryana", "region": "North India", "type": "Metro",
        "population": "0.15 Cr",
        "desc": "Millennium City bordering Delhi. India's major financial and tech district with premium residential zones.",
    },
    "Noida": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Metro",
        "population": "0.64 Cr",
        "desc": "Planned satellite city of Delhi. Major IT and media hub with well-developed metro infrastructure.",
    },
    "Navi-Mumbai": {
        "state": "Maharashtra", "region": "West India", "type": "Tier 1",
        "population": "0.11 Cr",
        "desc": "Planned satellite city of Mumbai. More affordable and well-organised than Mumbai proper.",
    },
    "Thane": {
        "state": "Maharashtra", "region": "West India", "type": "Tier 1",
        "population": "0.18 Cr",
        "desc": "City of Lakes bordering Mumbai. A major residential and industrial suburb with growing IT parks.",
    },
    "Chandigarh": {
        "state": "Punjab/Haryana", "region": "North India", "type": "Tier 1",
        "population": "0.12 Cr",
        "desc": "India's most planned city. Clean, green, and efficiently managed with a high quality of life.",
    },
    "Kochi": {
        "state": "Kerala", "region": "South India", "type": "Tier 1",
        "population": "0.22 Cr",
        "desc": "Queen of the Arabian Sea. A business and tourism hub with excellent infrastructure and coastal lifestyle.",
    },
    "Indore": {
        "state": "Madhya Pradesh", "region": "Central India", "type": "Tier 1",
        "population": "0.35 Cr",
        "desc": "Cleanest city in India. A growing commercial and educational hub known for its street food and trade.",
    },
    "Bhopal": {
        "state": "Madhya Pradesh", "region": "Central India", "type": "Tier 1",
        "population": "0.23 Cr",
        "desc": "City of Lakes. State capital of Madhya Pradesh with growing IT presence and affordable living.",
    },
    "Surat": {
        "state": "Gujarat", "region": "West India", "type": "Tier 1",
        "population": "0.7 Cr",
        "desc": "Diamond hub of the world. One of the fastest-growing cities in India by GDP.",
    },
    "Vadodara": {
        "state": "Gujarat", "region": "West India", "type": "Tier 1",
        "population": "0.22 Cr",
        "desc": "Cultural capital of Gujarat. Known for its Baroda culture, fine arts, and industrial strength.",
    },
    "Nagpur": {
        "state": "Maharashtra", "region": "Central India", "type": "Tier 1",
        "population": "0.25 Cr",
        "desc": "Orange City of India, centrally located. Rapidly developing with a new metro and infrastructure.",
    },
    "Nashik": {
        "state": "Maharashtra", "region": "West India", "type": "Tier 1",
        "population": "0.15 Cr",
        "desc": "Wine capital of India. Growing IT and manufacturing hub with scenic Sahyadri surroundings.",
    },
    "Coimbatore": {
        "state": "Tamil Nadu", "region": "South India", "type": "Tier 1",
        "population": "0.21 Cr",
        "desc": "Manchester of South India. Key textile, engineering, and IT city with a very pleasant climate.",
    },
    "Thiruvananthapuram": {
        "state": "Kerala", "region": "South India", "type": "Tier 1",
        "population": "0.10 Cr",
        "desc": "Capital of God's Own Country. A scenic city with a strong IT and government employment base.",
    },
    "Visakhapatnam": {
        "state": "Andhra Pradesh", "region": "South India", "type": "Tier 1",
        "population": "0.20 Cr",
        "desc": "Jewel of the East Coast. A port city and proposed industrial hub with beautiful beaches.",
    },
    "Vijayawada": {
        "state": "Andhra Pradesh", "region": "South India", "type": "Tier 1",
        "population": "0.14 Cr",
        "desc": "Business capital of Andhra Pradesh on the Krishna river. Strong manufacturing and trade base.",
    },
    "Mysuru": {
        "state": "Karnataka", "region": "South India", "type": "Tier 2",
        "population": "0.10 Cr",
        "desc": "City of Palaces near Bangalore. A heritage tourism and education hub with very affordable living.",
    },
    "Mangalore": {
        "state": "Karnataka", "region": "South India", "type": "Tier 2",
        "population": "0.05 Cr",
        "desc": "Coastal city of Karnataka. Known for seafood, banking sector, and scenic beaches.",
    },
    "Madurai": {
        "state": "Tamil Nadu", "region": "South India", "type": "Tier 2",
        "population": "0.15 Cr",
        "desc": "Cultural capital of Tamil Nadu. One of the oldest cities in the world with a strong textile industry.",
    },
    "Trichy": {
        "state": "Tamil Nadu", "region": "South India", "type": "Tier 2",
        "population": "0.09 Cr",
        "desc": "Rock Fort city of Tamil Nadu. Educational and manufacturing hub with affordable living costs.",
    },
    "Varanasi": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Tier 2",
        "population": "0.12 Cr",
        "desc": "Spiritual capital of India. Ancient holy city on the Ganga with rich textiles and pilgrimage tourism.",
    },
    "Agra": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Tier 2",
        "population": "0.17 Cr",
        "desc": "City of the Taj Mahal. A major tourism centre and leather manufacturing hub.",
    },
    "Kanpur": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Tier 1",
        "population": "0.30 Cr",
        "desc": "Industrial capital of UP. Major leather, textile, and chemicals manufacturing hub.",
    },
    "Patna": {
        "state": "Bihar", "region": "East India", "type": "Tier 2",
        "population": "0.20 Cr",
        "desc": "Ancient Pataliputra. Bihar's capital with growing infrastructure and very affordable living costs.",
    },
    "Ranchi": {
        "state": "Jharkhand", "region": "East India", "type": "Tier 2",
        "population": "0.14 Cr",
        "desc": "City of Waterfalls. Jharkhand's capital with mineral wealth and growing urban development.",
    },
    "Bhubaneswar": {
        "state": "Odisha", "region": "East India", "type": "Tier 2",
        "population": "0.10 Cr",
        "desc": "Temple city of India and Odisha's capital. Rapidly growing as a smart city with IT parks.",
    },
    "Guwahati": {
        "state": "Assam", "region": "Northeast India", "type": "Tier 2",
        "population": "0.10 Cr",
        "desc": "Gateway to Northeast India. A trade and logistics hub on the Brahmaputra river.",
    },
    "Dehradun": {
        "state": "Uttarakhand", "region": "North India", "type": "Tier 2",
        "population": "0.08 Cr",
        "desc": "Gateway to the Garhwal Himalayas. A growing education and IT hub with a pleasant climate.",
    },
    "Amritsar": {
        "state": "Punjab", "region": "North India", "type": "Tier 2",
        "population": "0.14 Cr",
        "desc": "Holy city of Sikhism, home to the Golden Temple. A cultural and pilgrimage destination.",
    },
    "Ludhiana": {
        "state": "Punjab", "region": "North India", "type": "Tier 1",
        "population": "0.18 Cr",
        "desc": "Industrial capital of Punjab. Major hosiery and bicycle manufacturing centre.",
    },
    "Jodhpur": {
        "state": "Rajasthan", "region": "North India", "type": "Tier 2",
        "population": "0.10 Cr",
        "desc": "The Blue City. Royal Rajputana heritage, tourism, and handicrafts are the core of its economy.",
    },
    "Udaipur": {
        "state": "Rajasthan", "region": "North India", "type": "Tier 2",
        "population": "0.05 Cr",
        "desc": "City of Lakes. Known as the Venice of the East, a romantic tourism and heritage city.",
    },
    "Kota": {
        "state": "Rajasthan", "region": "North India", "type": "Tier 2",
        "population": "0.10 Cr",
        "desc": "Coaching capital of India. Major education hub with students from across the country.",
    },
    "Goa": {
        "state": "Goa", "region": "West India", "type": "Tier 1",
        "population": "0.07 Cr",
        "desc": "India's party capital and beach state. Tourism-driven economy with a unique blend of cultures.",
    },
    "Siliguri": {
        "state": "West Bengal", "region": "East India", "type": "Tier 2",
        "population": "0.07 Cr",
        "desc": "Chicken's Neck. Gateway city to Sikkim and Northeast India, a key trade and logistics hub.",
    },
    "Jamshedpur": {
        "state": "Jharkhand", "region": "East India", "type": "Tier 2",
        "population": "0.15 Cr",
        "desc": "Steel City of India. Home to Tata Steel, one of India's finest planned industrial cities.",
    },
    "Aurangabad": {
        "state": "Maharashtra", "region": "West India", "type": "Tier 2",
        "population": "0.12 Cr",
        "desc": "Gateway to Ajanta-Ellora. A growing manufacturing hub known for Paithani silk and tourism.",
    },
    "Kolhapur": {
        "state": "Maharashtra", "region": "West India", "type": "Tier 2",
        "population": "0.06 Cr",
        "desc": "Karveer city of Maharashtra. Known for kolhapuri chappal, jaggery, and wrestling traditions.",
    },
    "Hubli-Dharwad": {
        "state": "Karnataka", "region": "South India", "type": "Tier 2",
        "population": "0.09 Cr",
        "desc": "Twin cities of North Karnataka. Major commercial and educational centre for the region.",
    },
    "Warangal": {
        "state": "Telangana", "region": "South India", "type": "Tier 2",
        "population": "0.08 Cr",
        "desc": "Heritage city of the Kakatiya dynasty. Growing educational and IT hub in Telangana.",
    },
    "Raipur": {
        "state": "Chhattisgarh", "region": "Central India", "type": "Tier 2",
        "population": "0.10 Cr",
        "desc": "Steel city of India. Chhattisgarh's capital with a growing economy and very low cost of living.",
    },
    "Gwalior": {
        "state": "Madhya Pradesh", "region": "Central India", "type": "Tier 2",
        "population": "0.12 Cr",
        "desc": "City of the Scindia dynasty. A historical city with a famous fort and growing economy.",
    },
    "Prayagraj": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Tier 2",
        "population": "0.12 Cr",
        "desc": "City of Kumbh Mela. A sacred city at the confluence of the Ganga, Yamuna, and Saraswati.",
    },
    "Meerut": {
        "state": "Uttar Pradesh", "region": "North India", "type": "Tier 2",
        "population": "0.14 Cr",
        "desc": "Sports goods capital of India. Historical city near Delhi with a growing industrial base.",
    },
}

def get_meta(city_name: str) -> dict:
    """Returns metadata for a city, with a sensible fallback."""
    meta = CITY_META.get(city_name, {})
    if not meta:
        return {
            "state": "India",
            "region": "India",
            "type": "City",
            "population": "—",
            "desc": f"{city_name} is an emerging city in India with growing infrastructure and economic activity.",
        }
    return meta
