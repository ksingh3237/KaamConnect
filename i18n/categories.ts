// Service names and typical jobs in Hindi and Punjabi, by category id. The server sends the three titles of a category,
// but some places only get its id and English name (a worker's trade, a job in a list), and the "typical jobs" line
// comes in English only. Titles match prisma/data/service-categories.ts in the backend; a category added there later
// shows its English until it is added here.
import type { Lang } from './index';

type Text = { title: string; examples: string };

export const CATEGORY_TEXT: Record<string, { hi: Text; pa: Text }> = {
  electrician: {
    hi: { title: 'विद्युत कारीगर', examples: 'शॉर्ट सर्किट, पंखा, MCB ट्रिप, स्विचबोर्ड' },
    pa: { title: 'ਬਿਜਲੀ ਮਿਸਤਰੀ', examples: 'ਸ਼ਾਰਟ ਸਰਕਟ, ਪੱਖਾ, MCB ਟ੍ਰਿਪ, ਸਵਿੱਚਬੋਰਡ' },
  },
  plumber: {
    hi: { title: 'प्लंबर / नलसाज', examples: 'पाइप लीकेज, नल, गीज़र, मोटर, टंकी' },
    pa: { title: 'ਪਲੰਬਰ', examples: 'ਪਾਈਪ ਲੀਕੇਜ, ਟੂਟੀ, ਗੀਜ਼ਰ, ਮੋਟਰ, ਟੈਂਕੀ' },
  },
  ac_repair: {
    hi: { title: 'एसी रिपेयर', examples: 'गैस रिफिल, सर्विस, PCB, इंस्टॉलेशन' },
    pa: { title: 'ਏਸੀ ਰਿਪੇਅਰ', examples: 'ਗੈਸ ਰੀਫਿਲ, ਸਰਵਿਸ, PCB, ਇੰਸਟਾਲੇਸ਼ਨ' },
  },
  carpenter: {
    hi: { title: 'बढ़ई / लकड़ी काम', examples: 'दरवाज़े के ताले, कब्ज़े, मॉड्यूलर किचन, फ़र्नीचर' },
    pa: { title: 'ਤਰਖਾਣ', examples: 'ਦਰਵਾਜ਼ੇ ਦੇ ਤਾਲੇ, ਕਬਜ਼ੇ, ਮਾਡਿਊਲਰ ਕਿਚਨ, ਫ਼ਰਨੀਚਰ' },
  },
  painter: {
    hi: { title: 'पेंटर व पुट्टी', examples: 'टचअप, वॉटरप्रूफ़िंग, दीवार टेक्सचर' },
    pa: { title: 'ਪੇਂਟਰ', examples: 'ਟਚਅੱਪ, ਵਾਟਰਪਰੂਫ਼ਿੰਗ, ਕੰਧ ਟੈਕਸਚਰ' },
  },
  cleaner: {
    hi: { title: 'घर व डीप सफाई', examples: 'पूरे घर की डीप सफाई, रसोई, बाथरूम, सोफ़ा व कालीन सफाई' },
    pa: { title: 'ਘਰ ਅਤੇ ਡੀਪ ਸਫ਼ਾਈ', examples: 'ਪੂਰੇ ਘਰ ਦੀ ਡੀਪ ਸਫ਼ਾਈ, ਰਸੋਈ, ਬਾਥਰੂਮ, ਸੋਫ਼ਾ ਅਤੇ ਕਾਲੀਨ ਸਫ਼ਾਈ' },
  },
  appliance: {
    hi: { title: 'उपकरण रिपेयर', examples: 'वॉशिंग मशीन, आरओ, माइक्रोवेव, फ्रिज' },
    pa: { title: 'ਘਰੇਲੂ ਉਪਕਰਣ', examples: 'ਵਾਸ਼ਿੰਗ ਮਸ਼ੀਨ, ਆਰ.ਓ., ਮਾਈਕ੍ਰੋਵੇਵ, ਫ਼ਰਿੱਜ' },
  },
  car_wash: {
    hi: { title: 'वाहन धुलाई', examples: 'घर पर फ़ोम वॉश, अंदर की सफाई' },
    pa: { title: 'ਵਾਹਨ ਸਫ਼ਾਈ', examples: 'ਘਰ ਉੱਤੇ ਫ਼ੋਮ ਵਾਸ਼, ਅੰਦਰਲੀ ਸਫ਼ਾਈ' },
  },
  vehicle_repair: {
    hi: { title: 'वाहन मरम्मत / मैकेनिक', examples: 'कार व बाइक मैकेनिक, रास्ते में मदद, पंक्चर, ट्यूनिंग' },
    pa: { title: 'ਵਾਹਨ ਮੁਰੰਮਤ', examples: 'ਕਾਰ ਅਤੇ ਬਾਈਕ ਮਕੈਨਿਕ, ਰਸਤੇ ਵਿੱਚ ਮਦਦ, ਪੰਕਚਰ, ਟਿਊਨਿੰਗ' },
  },
  ro_service: {
    hi: { title: 'आरओ / वॉटर प्यूरीफायर', examples: 'फ़िल्टर बदलना, इंस्टॉलेशन, पानी लीक' },
    pa: { title: 'ਆਰ.ਓ. ਵਾਟਰ ਪਿਊਰੀਫਾਇਰ', examples: 'ਫ਼ਿਲਟਰ ਬਦਲਣਾ, ਇੰਸਟਾਲੇਸ਼ਨ, ਪਾਣੀ ਲੀਕ' },
  },
  tv_repair: {
    hi: { title: 'टीवी व होम थिएटर', examples: 'LED/LCD स्क्रीन, दीवार पर लगाना, साउंडबार' },
    pa: { title: 'ਟੀਵੀ ਅਤੇ ਹੋਮ ਥੀਏਟਰ', examples: 'LED/LCD ਸਕ੍ਰੀਨ, ਕੰਧ ਉੱਤੇ ਲਗਾਉਣਾ, ਸਾਊਂਡਬਾਰ' },
  },
  fridge_repair: {
    hi: { title: 'फ्रिज रिपेयर', examples: 'ठंडा नहीं करता, गैस रिफिल, थर्मोस्टैट' },
    pa: { title: 'ਫ਼ਰਿੱਜ ਰਿਪੇਅਰ', examples: 'ਠੰਡਾ ਨਹੀਂ ਕਰਦਾ, ਗੈਸ ਰੀਫਿਲ, ਥਰਮੋਸਟੈਟ' },
  },
  packers_movers: {
    hi: { title: 'पैकर्स व मूवर्स', examples: 'घर शिफ़्टिंग, सामान ढुलाई, लोडिंग टेम्पो' },
    pa: { title: 'ਪੈਕਰਜ਼ ਅਤੇ ਮੂਵਰਜ਼', examples: 'ਘਰ ਸ਼ਿਫ਼ਟਿੰਗ, ਸਮਾਨ ਢੁਆਈ, ਲੋਡਿੰਗ ਟੈਂਪੂ' },
  },
  glass_works: {
    hi: { title: 'कांच व एल्युमिनियम', examples: 'खिड़की का कांच, स्लाइडिंग दरवाज़ा, बाथरूम केबिन, जाली' },
    pa: { title: 'ਸ਼ੀਸ਼ਾ ਅਤੇ ਐਲੂਮੀਨੀਅਮ', examples: 'ਖਿੜਕੀ ਦਾ ਸ਼ੀਸ਼ਾ, ਸਲਾਈਡਿੰਗ ਦਰਵਾਜ਼ਾ, ਬਾਥਰੂਮ ਕੈਬਿਨ, ਜਾਲੀ' },
  },
  generator_service: {
    hi: { title: 'जनरेटर सर्विस', examples: 'जेनसेट रिपेयर, डीज़ल जनरेटर रखरखाव' },
    pa: { title: 'ਜਨਰੇਟਰ ਸਰਵਿਸ', examples: 'ਜੈਨਸੈੱਟ ਰਿਪੇਅਰ, ਡੀਜ਼ਲ ਜਨਰੇਟਰ ਦੀ ਸਾਂਭ-ਸੰਭਾਲ' },
  },
  gardening: {
    hi: { title: 'बागवानी / माली', examples: 'घास कटाई, पेड़ों की छंटाई, मिट्टी व पौधों की देखभाल' },
    pa: { title: 'ਬਾਗਬਾਨੀ / ਮਾਲੀ', examples: 'ਘਾਹ ਕਟਾਈ, ਰੁੱਖਾਂ ਦੀ ਛਾਂਟੀ, ਮਿੱਟੀ ਅਤੇ ਪੌਦਿਆਂ ਦੀ ਦੇਖਭਾਲ' },
  },
  computer_it: {
    hi: { title: 'कंप्यूटर व आईटी', examples: 'लैपटॉप रिपेयर, वाईफ़ाई राउटर, प्रिंटर सेटअप, OS इंस्टॉल' },
    pa: { title: 'ਕੰਪਿਊਟਰ ਅਤੇ ਆਈਟੀ', examples: 'ਲੈਪਟਾਪ ਰਿਪੇਅਰ, ਵਾਈਫ਼ਾਈ ਰਾਊਟਰ, ਪ੍ਰਿੰਟਰ ਸੈੱਟਅੱਪ, OS ਇੰਸਟਾਲ' },
  },
  civil_construction: {
    hi: { title: 'मिस्त्री व निर्माण', examples: 'राजमिस्त्री, टाइल लगाना, प्लास्टर, मार्बल पॉलिश' },
    pa: { title: 'ਮਿਸਤਰੀ ਅਤੇ ਉਸਾਰੀ', examples: 'ਰਾਜ ਮਿਸਤਰੀ, ਟਾਈਲ ਲਗਾਉਣਾ, ਪਲੱਸਤਰ, ਮਾਰਬਲ ਪਾਲਿਸ਼' },
  },
  catering_food: {
    hi: { title: 'हलवाई व कुक', examples: 'पार्टी हलवाई, घर का कुक, छोटे फ़ंक्शन की कैटरिंग' },
    pa: { title: 'ਹਲਵਾਈ ਅਤੇ ਕੁੱਕ', examples: 'ਪਾਰਟੀ ਹਲਵਾਈ, ਘਰ ਦਾ ਕੁੱਕ, ਛੋਟੇ ਫ਼ੰਕਸ਼ਨ ਦੀ ਕੇਟਰਿੰਗ' },
  },
  cctv_security: {
    hi: { title: 'सीसीटीवी कैमरा इंस्टॉलेशन', examples: 'कैमरा इंस्टॉलेशन, DVR रिपेयर, वीडियो इंटरकॉम' },
    pa: { title: 'ਸੀਸੀਟੀਵੀ ਕੈਮਰਾ ਇੰਸਟਾਲੇਸ਼ਨ', examples: 'ਕੈਮਰਾ ਇੰਸਟਾਲੇਸ਼ਨ, DVR ਰਿਪੇਅਰ, ਵੀਡੀਓ ਇੰਟਰਕਾਮ' },
  },
};

/** A service's name in `lang`, from its id; `english` (what the server sent) when there is no translation. */
export function categoryTitle(id: string, english: string, lang: Lang): string {
  return lang === 'en' ? english : CATEGORY_TEXT[id]?.[lang].title ?? english;
}

/** The "typical jobs" line of a service in `lang`. */
export function categoryExamples(id: string, english: string, lang: Lang): string {
  return lang === 'en' ? english : CATEGORY_TEXT[id]?.[lang].examples ?? english;
}
