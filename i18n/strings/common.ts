// Shared pieces (dialogs, loading and error states, offers, service cards) and the customer's Home and Compare Offers.
export const common: Record<string, { hi: string; pa: string }> = {
  // Dialogs, states
  OK: { hi: 'ठीक है', pa: 'ਠੀਕ ਹੈ' },
  Cancel: { hi: 'रद्द करें', pa: 'ਰੱਦ ਕਰੋ' },
  Close: { hi: 'बंद करें', pa: 'ਬੰਦ ਕਰੋ' },
  'Loading…': { hi: 'लोड हो रहा है…', pa: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…' },
  'Try again': { hi: 'दोबारा कोशिश करें', pa: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ' },
  'Go back': { hi: 'वापस जाएँ', pa: 'ਵਾਪਸ ਜਾਓ' },
  'Direct phone call': { hi: 'सीधा फ़ोन कॉल', pa: 'ਸਿੱਧੀ ਫ਼ੋਨ ਕਾਲ' },
  'Call {name} at {phone}?\n0% commission: you talk and pay directly.': {
    hi: '{name} को {phone} पर कॉल करें?\n0% कमीशन: आप सीधे बात करें और सीधे भुगतान करें।',
    pa: '{name} ਨੂੰ {phone} ’ਤੇ ਕਾਲ ਕਰੋ?\n0% ਕਮਿਸ਼ਨ: ਤੁਸੀਂ ਸਿੱਧੀ ਗੱਲ ਕਰੋ ਅਤੇ ਸਿੱਧਾ ਭੁਗਤਾਨ ਕਰੋ।',
  },
  'Call now': { hi: 'अभी कॉल करें', pa: 'ਹੁਣੇ ਕਾਲ ਕਰੋ' },
  'Could not start the call': { hi: 'कॉल शुरू नहीं हो सकी', pa: 'ਕਾਲ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋ ਸਕੀ' },
  'Please dial {phone} from your phone.': { hi: 'कृपया अपने फ़ोन से {phone} डायल करें।', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਫ਼ੋਨ ਤੋਂ {phone} ਡਾਇਲ ਕਰੋ।' },

  // Service cards
  'Visit Fee Applicable': { hi: 'विज़िट शुल्क लागू', pa: 'ਵਿਜ਼ਿਟ ਫ਼ੀਸ ਲਾਗੂ' },
  'Book Direct': { hi: 'सीधे बुक करें', pa: 'ਸਿੱਧਾ ਬੁੱਕ ਕਰੋ' },
  '0% FEE': { hi: '0% शुल्क', pa: '0% ਫ਼ੀਸ' },

  // Offer cards (Home and Compare Offers)
  'FASTEST ARRIVAL ({min} MIN)': { hi: 'सबसे जल्दी पहुँचेंगे ({min} मिनट)', pa: 'ਸਭ ਤੋਂ ਜਲਦੀ ਪਹੁੰਚਣਗੇ ({min} ਮਿੰਟ)' },
  New: { hi: 'नया', pa: 'ਨਵਾਂ' },
  '{km} km': { hi: '{km} कि.मी.', pa: '{km} ਕਿ.ਮੀ.' },
  '{min} Min ETA': { hi: '{min} मिनट में', pa: '{min} ਮਿੰਟ ਵਿੱਚ' },
  'Offered Visit Fee': { hi: 'प्रस्तावित विज़िट शुल्क', pa: 'ਪੇਸ਼ ਕੀਤੀ ਵਿਜ਼ਿਟ ਫ਼ੀਸ' },
  '(0% App Fee)': { hi: '(0% ऐप शुल्क)', pa: '(0% ਐਪ ਫ਼ੀਸ)' },
  'You booked this worker': { hi: 'आपने इस कारीगर को बुक किया', pa: 'ਤੁਸੀਂ ਇਸ ਕਾਰੀਗਰ ਨੂੰ ਬੁੱਕ ਕੀਤਾ' },
  'Direct Call': { hi: 'सीधा कॉल', pa: 'ਸਿੱਧੀ ਕਾਲ' },
  Call: { hi: 'कॉल', pa: 'ਕਾਲ' },
  'Decline this offer': { hi: 'यह ऑफ़र अस्वीकार करें', pa: 'ਇਹ ਪੇਸ਼ਕਸ਼ ਨਾਮਨਜ਼ੂਰ ਕਰੋ' },
  Decline: { hi: 'अस्वीकार', pa: 'ਨਾਮਨਜ਼ੂਰ' },
  'Accept Offer': { hi: 'ऑफ़र स्वीकार करें', pa: 'ਪੇਸ਼ਕਸ਼ ਮਨਜ਼ੂਰ ਕਰੋ' },
  Booked: { hi: 'बुक है', pa: 'ਬੁੱਕ ਹੈ' },
  'Accept ✓': { hi: 'स्वीकार ✓', pa: 'ਮਨਜ਼ੂਰ ✓' },
  'This worker is busy at that time. Choose another offer.': {
    hi: 'यह कारीगर उस समय व्यस्त है। कोई दूसरा ऑफ़र चुनें।',
    pa: 'ਇਹ ਕਾਰੀਗਰ ਉਸ ਸਮੇਂ ਰੁੱਝਿਆ ਹੈ। ਕੋਈ ਹੋਰ ਪੇਸ਼ਕਸ਼ ਚੁਣੋ।',
  },
  'Could not accept': { hi: 'स्वीकार नहीं हो सका', pa: 'ਮਨਜ਼ੂਰ ਨਹੀਂ ਹੋ ਸਕਿਆ' },
  'Decline this offer?': { hi: 'यह ऑफ़र अस्वीकार करें?', pa: 'ਇਹ ਪੇਸ਼ਕਸ਼ ਨਾਮਨਜ਼ੂਰ ਕਰਨੀ ਹੈ?' },
  '{name} will be told you declined. You can still accept the other offers.': {
    hi: '{name} को बताया जाएगा कि आपने मना किया। आप बाकी ऑफ़र अब भी स्वीकार कर सकते हैं।',
    pa: '{name} ਨੂੰ ਦੱਸਿਆ ਜਾਵੇਗਾ ਕਿ ਤੁਸੀਂ ਮਨ੍ਹਾ ਕੀਤਾ। ਤੁਸੀਂ ਬਾਕੀ ਪੇਸ਼ਕਸ਼ਾਂ ਹਾਲੇ ਵੀ ਮਨਜ਼ੂਰ ਕਰ ਸਕਦੇ ਹੋ।',
  },
  'Could not decline': { hi: 'अस्वीकार नहीं हो सका', pa: 'ਨਾਮਨਜ਼ੂਰ ਨਹੀਂ ਹੋ ਸਕਿਆ' },
  '1 Offer': { hi: '1 ऑफ़र', pa: '1 ਪੇਸ਼ਕਸ਼' },
  '{count} Offers': { hi: '{count} ऑफ़र', pa: '{count} ਪੇਸ਼ਕਸ਼ਾਂ' },

  // New-quote popup (OfferToastHost)
  'See all {count} offers': { hi: 'सभी {count} ऑफ़र देखें', pa: 'ਸਾਰੀਆਂ {count} ਪੇਸ਼ਕਸ਼ਾਂ ਵੇਖੋ' },

  'New quote {position} of {total} • {title}': { hi: 'नया कोटेशन {position} / {total} • {title}', pa: 'ਨਵਾਂ ਕੋਟੇਸ਼ਨ {position} / {total} • {title}' },

  // Compare Offers
  'You already booked a worker for this request.': { hi: 'आप इस अनुरोध के लिए कारीगर बुक कर चुके हैं।', pa: 'ਤੁਸੀਂ ਇਸ ਬੇਨਤੀ ਲਈ ਕਾਰੀਗਰ ਬੁੱਕ ਕਰ ਚੁੱਕੇ ਹੋ।' },
  'Track your worker': { hi: 'अपने कारीगर को ट्रैक करें', pa: 'ਆਪਣੇ ਕਾਰੀਗਰ ਨੂੰ ਟ੍ਰੈਕ ਕਰੋ' },
  'The work is done. Review the bill and pay your worker.': {
    hi: 'काम पूरा हो गया। बिल देखें और कारीगर को भुगतान करें।',
    pa: 'ਕੰਮ ਪੂਰਾ ਹੋ ਗਿਆ। ਬਿੱਲ ਵੇਖੋ ਅਤੇ ਕਾਰੀਗਰ ਨੂੰ ਭੁਗਤਾਨ ਕਰੋ।',
  },
  'Review bill & pay': { hi: 'बिल देखें और भुगतान करें', pa: 'ਬਿੱਲ ਵੇਖੋ ਅਤੇ ਭੁਗਤਾਨ ਕਰੋ' },
  'This job is complete.': { hi: 'यह काम पूरा हो गया है।', pa: 'ਇਹ ਕੰਮ ਪੂਰਾ ਹੋ ਗਿਆ ਹੈ।' },
  'My requests': { hi: 'मेरे अनुरोध', pa: 'ਮੇਰੀਆਂ ਬੇਨਤੀਆਂ' },
  'This request has expired, so its quotes can no longer be accepted.': {
    hi: 'इस अनुरोध का समय खत्म हो गया है, इसलिए इसके कोटेशन अब स्वीकार नहीं हो सकते।',
    pa: 'ਇਸ ਬੇਨਤੀ ਦਾ ਸਮਾਂ ਖ਼ਤਮ ਹੋ ਗਿਆ ਹੈ, ਇਸ ਲਈ ਇਸਦੇ ਕੋਟੇਸ਼ਨ ਹੁਣ ਮਨਜ਼ੂਰ ਨਹੀਂ ਹੋ ਸਕਦੇ।',
  },
  'This request was cancelled.': { hi: 'यह अनुरोध रद्द हो गया था।', pa: 'ਇਹ ਬੇਨਤੀ ਰੱਦ ਹੋ ਗਈ ਸੀ।' },
  'Post a new request': { hi: 'नया अनुरोध पोस्ट करें', pa: 'ਨਵੀਂ ਬੇਨਤੀ ਪੋਸਟ ਕਰੋ' },
  'Compare Incoming Offers': { hi: 'आए हुए ऑफ़र की तुलना करें', pa: 'ਆਈਆਂ ਪੇਸ਼ਕਸ਼ਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ' },
  '1 Verified Worker Responded': { hi: '1 सत्यापित कारीगर ने जवाब दिया', pa: '1 ਪ੍ਰਮਾਣਿਤ ਕਾਰੀਗਰ ਨੇ ਜਵਾਬ ਦਿੱਤਾ' },
  '{count} Verified Workers Responded': { hi: '{count} सत्यापित कारीगरों ने जवाब दिया', pa: '{count} ਪ੍ਰਮਾਣਿਤ ਕਾਰੀਗਰਾਂ ਨੇ ਜਵਾਬ ਦਿੱਤਾ' },
  'LIVE OFFERS': { hi: 'लाइव ऑफ़र', pa: 'ਲਾਈਵ ਪੇਸ਼ਕਸ਼ਾਂ' },
  'Select an Artisan & Confirm Arrival:': { hi: 'कारीगर चुनें और आगमन पक्का करें:', pa: 'ਕਾਰੀਗਰ ਚੁਣੋ ਅਤੇ ਆਉਣਾ ਪੱਕਾ ਕਰੋ:' },
  'Open a request to see its quotes': { hi: 'कोटेशन देखने के लिए कोई अनुरोध खोलें', pa: 'ਕੋਟੇਸ਼ਨ ਵੇਖਣ ਲਈ ਕੋਈ ਬੇਨਤੀ ਖੋਲ੍ਹੋ' },
  'Your requests are in Activity.': { hi: 'आपके अनुरोध गतिविधि में हैं।', pa: 'ਤੁਹਾਡੀਆਂ ਬੇਨਤੀਆਂ ਗਤੀਵਿਧੀ ਵਿੱਚ ਹਨ।' },
  'Waiting for quotes…': { hi: 'कोटेशन का इंतज़ार…', pa: 'ਕੋਟੇਸ਼ਨ ਦੀ ਉਡੀਕ…' },
  'No quotes yet': { hi: 'अभी कोई कोटेशन नहीं', pa: 'ਹਾਲੇ ਕੋਈ ਕੋਟੇਸ਼ਨ ਨਹੀਂ' },
  'Nearby artisans have been notified. This page refreshes by itself.': {
    hi: 'आस-पास के कारीगरों को सूचना दे दी गई है। यह पेज अपने आप अपडेट होता है।',
    pa: 'ਨੇੜਲੇ ਕਾਰੀਗਰਾਂ ਨੂੰ ਸੂਚਨਾ ਦੇ ਦਿੱਤੀ ਗਈ ਹੈ। ਇਹ ਪੰਨਾ ਆਪਣੇ ਆਪ ਅੱਪਡੇਟ ਹੁੰਦਾ ਹੈ।',
  },

  // Customer Home
  'Choose your sector': { hi: 'अपना सेक्टर चुनें', pa: 'ਆਪਣਾ ਸੈਕਟਰ ਚੁਣੋ' },
  'Select a service or post your job': { hi: 'सेवा चुनें या अपना काम पोस्ट करें', pa: 'ਸੇਵਾ ਚੁਣੋ ਜਾਂ ਆਪਣਾ ਕੰਮ ਪੋਸਟ ਕਰੋ' },
  'Get direct calls & quotes from nearby mistris': { hi: 'आस-पास के मिस्त्रियों से सीधे कॉल और कोटेशन पाएँ', pa: 'ਨੇੜਲੇ ਮਿਸਤਰੀਆਂ ਤੋਂ ਸਿੱਧੀਆਂ ਕਾਲਾਂ ਅਤੇ ਕੋਟੇਸ਼ਨ ਪਾਓ' },
  'Pay the worker directly by cash or UPI (0% commission)': {
    hi: 'कारीगर को सीधे कैश या UPI से भुगतान करें (0% कमीशन)',
    pa: 'ਕਾਰੀਗਰ ਨੂੰ ਸਿੱਧਾ ਕੈਸ਼ ਜਾਂ UPI ਨਾਲ ਭੁਗਤਾਨ ਕਰੋ (0% ਕਮਿਸ਼ਨ)',
  },
  'Aadhaar verified workers': { hi: 'आधार सत्यापित कारीगर', pa: 'ਆਧਾਰ ਪ੍ਰਮਾਣਿਤ ਕਾਰੀਗਰ' },
  '15 min arrival in Chandigarh, Mohali & Panchkula': {
    hi: 'चंडीगढ़, मोहाली और पंचकूला में 15 मिनट में पहुँच',
    pa: 'ਚੰਡੀਗੜ੍ਹ, ਮੋਹਾਲੀ ਅਤੇ ਪੰਚਕੂਲਾ ਵਿੱਚ 15 ਮਿੰਟ ਵਿੱਚ ਪਹੁੰਚ',
  },
  '100% direct P2P payment': { hi: 'पूरा पैसा सीधे कारीगर को', pa: 'ਪੂਰਾ ਪੈਸਾ ਸਿੱਧਾ ਕਾਰੀਗਰ ਨੂੰ' },
  'Open menu': { hi: 'मेन्यू खोलें', pa: 'ਮੀਨੂ ਖੋਲ੍ਹੋ' },
  'Change location': { hi: 'जगह बदलें', pa: 'ਥਾਂ ਬਦਲੋ' },
  'Audio help': { hi: 'आवाज़ सहायता', pa: 'ਆਵਾਜ਼ ਸਹਾਇਤਾ' },
  'Spoken instructions are coming soon.': { hi: 'बोलकर निर्देश जल्द आ रहे हैं।', pa: 'ਬੋਲ ਕੇ ਹਦਾਇਤਾਂ ਜਲਦੀ ਆ ਰਹੀਆਂ ਹਨ।' },
  'Audio assistance': { hi: 'आवाज़ सहायता', pa: 'ਆਵਾਜ਼ ਸਹਾਇਤਾ' },
  'Search electrician, plumber, AC, RO…': { hi: 'इलेक्ट्रीशियन, प्लंबर, एसी, आरओ खोजें…', pa: 'ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ, ਪਲੰਬਰ, ਏਸੀ, ਆਰ.ਓ. ਲੱਭੋ…' },
  'Search services': { hi: 'सेवाएँ खोजें', pa: 'ਸੇਵਾਵਾਂ ਲੱਭੋ' },
  'Clear search': { hi: 'खोज साफ़ करें', pa: 'ਖੋਜ ਸਾਫ਼ ਕਰੋ' },
  'Post a job': { hi: 'काम पोस्ट करें', pa: 'ਕੰਮ ਪੋਸਟ ਕਰੋ' },
  'Need an urgent mistri?': { hi: 'तुरंत मिस्त्री चाहिए?', pa: 'ਤੁਰੰਤ ਮਿਸਤਰੀ ਚਾਹੀਦਾ ਹੈ?' },
  '15 MIN ETA': { hi: '15 मिनट में', pa: '15 ਮਿੰਟ ਵਿੱਚ' },
  'Post an immediate job and nearby pros respond fast.': {
    hi: 'तुरंत वाला काम पोस्ट करें, आस-पास के कारीगर जल्दी जवाब देंगे।',
    pa: 'ਤੁਰੰਤ ਵਾਲਾ ਕੰਮ ਪੋਸਟ ਕਰੋ, ਨੇੜਲੇ ਕਾਰੀਗਰ ਜਲਦੀ ਜਵਾਬ ਦੇਣਗੇ।',
  },
  '0% Platform Fee Guarantee': { hi: '0% प्लेटफ़ॉर्म शुल्क की गारंटी', pa: '0% ਪਲੇਟਫ਼ਾਰਮ ਫ਼ੀਸ ਦੀ ਗਾਰੰਟੀ' },
  'Pay 100% directly to the technician by UPI or cash. No middleman.': {
    hi: 'पूरा भुगतान सीधे कारीगर को UPI या कैश से करें। कोई बिचौलिया नहीं।',
    pa: 'ਪੂਰਾ ਭੁਗਤਾਨ ਸਿੱਧਾ ਕਾਰੀਗਰ ਨੂੰ UPI ਜਾਂ ਕੈਸ਼ ਨਾਲ ਕਰੋ। ਕੋਈ ਵਿਚੋਲਾ ਨਹੀਂ।',
  },
  'Results for “{query}”': { hi: '“{query}” के नतीजे', pa: '“{query}” ਦੇ ਨਤੀਜੇ' },
  'Popular Services in Tricity': { hi: 'ट्राईसिटी की लोकप्रिय सेवाएँ', pa: 'ਟ੍ਰਾਈਸਿਟੀ ਦੀਆਂ ਮਸ਼ਹੂਰ ਸੇਵਾਵਾਂ' },
  'View All →': { hi: 'सभी देखें →', pa: 'ਸਾਰੀਆਂ ਵੇਖੋ →' },
  'No matching service': { hi: 'कोई मिलती सेवा नहीं', pa: 'ਕੋਈ ਮਿਲਦੀ ਸੇਵਾ ਨਹੀਂ' },
  'Try another word, or post your job and nearby pros will quote.': {
    hi: 'कोई दूसरा शब्द आज़माएँ, या अपना काम पोस्ट करें और आस-पास के कारीगर कोटेशन देंगे।',
    pa: 'ਕੋਈ ਹੋਰ ਸ਼ਬਦ ਅਜ਼ਮਾਓ, ਜਾਂ ਆਪਣਾ ਕੰਮ ਪੋਸਟ ਕਰੋ ਅਤੇ ਨੇੜਲੇ ਕਾਰੀਗਰ ਕੋਟੇਸ਼ਨ ਦੇਣਗੇ।',
  },
  'Explore all {count}+ Services': { hi: 'सभी {count}+ सेवाएँ देखें', pa: 'ਸਾਰੀਆਂ {count}+ ਸੇਵਾਵਾਂ ਵੇਖੋ' },
  'Got a specific repair job?': { hi: 'कोई खास मरम्मत का काम है?', pa: 'ਕੋਈ ਖ਼ਾਸ ਮੁਰੰਮਤ ਦਾ ਕੰਮ ਹੈ?' },
  'Post details and get quotes from nearby mistris.': {
    hi: 'जानकारी पोस्ट करें और आस-पास के मिस्त्रियों से कोटेशन पाएँ।',
    pa: 'ਜਾਣਕਾਰੀ ਪੋਸਟ ਕਰੋ ਅਤੇ ਨੇੜਲੇ ਮਿਸਤਰੀਆਂ ਤੋਂ ਕੋਟੇਸ਼ਨ ਪਾਓ।',
  },
  '+ Post Job': { hi: '+ काम पोस्ट करें', pa: '+ ਕੰਮ ਪੋਸਟ ਕਰੋ' },
  'How KaamConnect Works • 3 easy steps': { hi: 'KaamConnect कैसे काम करता है • 3 आसान कदम', pa: 'KaamConnect ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ • 3 ਸੌਖੇ ਕਦਮ' },
  'Tricity Direct Trust': { hi: 'ट्राईसिटी का भरोसा', pa: 'ਟ੍ਰਾਈਸਿਟੀ ਦਾ ਭਰੋਸਾ' },
};
