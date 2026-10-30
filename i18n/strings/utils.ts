// Shared wording from utils/: cancellation reasons and messages, location and camera permissions, late notices,
// notifications the phone itself shows, times ("3h ago"), and the trade picker tabs.
export const utils: Record<string, { hi: string; pa: string }> = {
  // Cancellation reasons
  'Vehicle problem': { hi: 'गाड़ी में खराबी', pa: 'ਗੱਡੀ ਵਿੱਚ ਖ਼ਰਾਬੀ' },
  'Personal emergency': { hi: 'निजी आपात स्थिति', pa: 'ਨਿੱਜੀ ਐਮਰਜੈਂਸੀ' },
  'Double-booked': { hi: 'दूसरा काम बुक है', pa: 'ਦੂਜਾ ਕੰਮ ਬੁੱਕ ਹੈ' },
  'Too far to reach in time': { hi: 'समय पर पहुँचना मुश्किल', pa: 'ਸਮੇਂ ਸਿਰ ਪਹੁੰਚਣਾ ਔਖਾ' },
  'Cannot do this work': { hi: 'यह काम नहीं कर सकता', pa: 'ਇਹ ਕੰਮ ਨਹੀਂ ਕਰ ਸਕਦਾ' },
  'Customer is not answering': { hi: 'ग्राहक फ़ोन नहीं उठा रहे', pa: 'ਗਾਹਕ ਫ਼ੋਨ ਨਹੀਂ ਚੁੱਕ ਰਹੇ' },
  'Address is wrong or cannot be found': { hi: 'पता गलत है या नहीं मिल रहा', pa: 'ਪਤਾ ਗ਼ਲਤ ਹੈ ਜਾਂ ਨਹੀਂ ਮਿਲ ਰਿਹਾ' },
  'Customer asked me to cancel': { hi: 'ग्राहक ने रद्द करने को कहा', pa: 'ਗਾਹਕ ਨੇ ਰੱਦ ਕਰਨ ਲਈ ਕਿਹਾ' },
  'Could not agree on the price': { hi: 'दाम पर सहमति नहीं बनी', pa: 'ਕੀਮਤ ’ਤੇ ਸਹਿਮਤੀ ਨਹੀਂ ਬਣੀ' },
  'The location felt unsafe': { hi: 'जगह सुरक्षित नहीं लगी', pa: 'ਥਾਂ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਲੱਗੀ' },
  'Changed my mind': { hi: 'इरादा बदल गया', pa: 'ਇਰਾਦਾ ਬਦਲ ਗਿਆ' },
  'Found another worker': { hi: 'दूसरा कारीगर मिल गया', pa: 'ਹੋਰ ਕਾਰੀਗਰ ਮਿਲ ਗਿਆ' },
  'The worker is taking too long': { hi: 'कारीगर को बहुत देर हो रही है', pa: 'ਕਾਰੀਗਰ ਨੂੰ ਬਹੁਤ ਦੇਰ ਹੋ ਰਹੀ ਹੈ' },
  'Cannot reach the worker': { hi: 'कारीगर से बात नहीं हो रही', pa: 'ਕਾਰੀਗਰ ਨਾਲ ਗੱਲ ਨਹੀਂ ਹੋ ਰਹੀ' },
  'Posted by mistake': { hi: 'गलती से पोस्ट हो गया', pa: 'ਗ਼ਲਤੀ ਨਾਲ ਪੋਸਟ ਹੋ ਗਿਆ' },
  'The price is too high': { hi: 'दाम बहुत ज़्यादा है', pa: 'ਕੀਮਤ ਬਹੁਤ ਜ਼ਿਆਦਾ ਹੈ' },
  'Other reason': { hi: 'कोई और कारण', pa: 'ਕੋਈ ਹੋਰ ਕਾਰਨ' },
  'No reason was given.': { hi: 'कोई कारण नहीं बताया गया।', pa: 'ਕੋਈ ਕਾਰਨ ਨਹੀਂ ਦੱਸਿਆ ਗਿਆ।' },
  'The worker did not arrive in time.': { hi: 'कारीगर समय पर नहीं पहुँचा।', pa: 'ਕਾਰੀਗਰ ਸਮੇਂ ਸਿਰ ਨਹੀਂ ਪਹੁੰਚਿਆ।' },

  // Cancel sheet and outcomes
  'the visit fee': { hi: 'विज़िट शुल्क', pa: 'ਵਿਜ਼ਿਟ ਫ਼ੀਸ' },
  'Leave this job?': { hi: 'यह काम छोड़ें?', pa: 'ਇਹ ਕੰਮ ਛੱਡਣਾ ਹੈ?' },
  'You are already at the customer’s place. Tell them why you cannot do the work. They are told straight away.': {
    hi: 'आप ग्राहक के यहाँ पहुँच चुके हैं। बताएँ कि आप काम क्यों नहीं कर सकते। उन्हें तुरंत बताया जाएगा।',
    pa: 'ਤੁਸੀਂ ਗਾਹਕ ਦੇ ਘਰ ਪਹੁੰਚ ਚੁੱਕੇ ਹੋ। ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕੰਮ ਕਿਉਂ ਨਹੀਂ ਕਰ ਸਕਦੇ। ਉਹਨਾਂ ਨੂੰ ਤੁਰੰਤ ਦੱਸਿਆ ਜਾਵੇਗਾ।',
  },
  'Leave the job': { hi: 'काम छोड़ें', pa: 'ਕੰਮ ਛੱਡੋ' },
  'Cancel this job?': { hi: 'यह काम रद्द करें?', pa: 'ਇਹ ਕੰਮ ਰੱਦ ਕਰਨਾ ਹੈ?' },
  'Tell the customer why you cannot come. They are told straight away, so please do it as early as you can.': {
    hi: 'ग्राहक को बताएँ कि आप क्यों नहीं आ सकते। उन्हें तुरंत बताया जाएगा, इसलिए जितना जल्दी हो सके करें।',
    pa: 'ਗਾਹਕ ਨੂੰ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕਿਉਂ ਨਹੀਂ ਆ ਸਕਦੇ। ਉਹਨਾਂ ਨੂੰ ਤੁਰੰਤ ਦੱਸਿਆ ਜਾਵੇਗਾ, ਇਸ ਲਈ ਜਿੰਨੀ ਜਲਦੀ ਹੋ ਸਕੇ ਕਰੋ।',
  },
  'Cancel the job': { hi: 'काम रद्द करें', pa: 'ਕੰਮ ਰੱਦ ਕਰੋ' },
  'Decline the cost and cancel?': { hi: 'दाम न मानें और रद्द करें?', pa: 'ਕੀਮਤ ਨਾ ਮੰਨ ਕੇ ਰੱਦ ਕਰਨਾ ਹੈ?' },
  'The worker has already come to you, so {fee} is payable to them directly. They are told straight away.': {
    hi: 'कारीगर आपके पास आ चुका है, इसलिए {fee} उन्हें सीधे देना होगा। उन्हें तुरंत बताया जाएगा।',
    pa: 'ਕਾਰੀਗਰ ਤੁਹਾਡੇ ਕੋਲ ਆ ਚੁੱਕਾ ਹੈ, ਇਸ ਲਈ {fee} ਉਹਨਾਂ ਨੂੰ ਸਿੱਧਾ ਦੇਣਾ ਪਵੇਗਾ। ਉਹਨਾਂ ਨੂੰ ਤੁਰੰਤ ਦੱਸਿਆ ਜਾਵੇਗਾ।',
  },
  'Decline and cancel': { hi: 'मना करें और रद्द करें', pa: 'ਨਾਂਹ ਕਰੋ ਅਤੇ ਰੱਦ ਕਰੋ' },
  'Cancel with the worker on the way?': { hi: 'कारीगर रास्ते में है, फिर भी रद्द करें?', pa: 'ਕਾਰੀਗਰ ਰਸਤੇ ਵਿੱਚ ਹੈ, ਫਿਰ ਵੀ ਰੱਦ ਕਰਨਾ ਹੈ?' },
  'Your worker is told straight away. Please cancel only if you really need to, they may already be travelling.': {
    hi: 'आपके कारीगर को तुरंत बताया जाएगा। ज़रूरी हो तभी रद्द करें, हो सकता है वे रास्ते में हों।',
    pa: 'ਤੁਹਾਡੇ ਕਾਰੀਗਰ ਨੂੰ ਤੁਰੰਤ ਦੱਸਿਆ ਜਾਵੇਗਾ। ਜ਼ਰੂਰੀ ਹੋਵੇ ਤਾਂ ਹੀ ਰੱਦ ਕਰੋ, ਹੋ ਸਕਦਾ ਹੈ ਉਹ ਰਸਤੇ ਵਿੱਚ ਹੋਣ।',
  },
  'Yes, cancel': { hi: 'हाँ, रद्द करें', pa: 'ਹਾਂ, ਰੱਦ ਕਰੋ' },
  'Cancel this request?': { hi: 'यह अनुरोध रद्द करें?', pa: 'ਇਹ ਬੇਨਤੀ ਰੱਦ ਕਰਨੀ ਹੈ?' },
  'Workers who already quoted will be told. You can post it again any time.': {
    hi: 'जिन कारीगरों ने कोटेशन दिया है उन्हें बताया जाएगा। आप इसे कभी भी फिर पोस्ट कर सकते हैं।',
    pa: 'ਜਿਨ੍ਹਾਂ ਕਾਰੀਗਰਾਂ ਨੇ ਕੋਟੇਸ਼ਨ ਦਿੱਤਾ ਹੈ ਉਹਨਾਂ ਨੂੰ ਦੱਸਿਆ ਜਾਵੇਗਾ। ਤੁਸੀਂ ਇਸਨੂੰ ਕਦੇ ਵੀ ਮੁੜ ਪੋਸਟ ਕਰ ਸਕਦੇ ਹੋ।',
  },
  'The job is closed and counts as a cancellation on your record. No visit fee is due.': {
    hi: 'काम बंद हो जाएगा और आपके रिकॉर्ड में रद्दीकरण गिना जाएगा। कोई विज़िट शुल्क नहीं मिलेगा।',
    pa: 'ਕੰਮ ਬੰਦ ਹੋ ਜਾਵੇਗਾ ਅਤੇ ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਵਿੱਚ ਰੱਦ ਕਰਨਾ ਗਿਣਿਆ ਜਾਵੇਗਾ। ਕੋਈ ਵਿਜ਼ਿਟ ਫ਼ੀਸ ਨਹੀਂ ਮਿਲੇਗੀ।',
  },
  'The job is closed. The customer is told {fee} is payable to you directly.': {
    hi: 'काम बंद हो जाएगा। ग्राहक को बताया जाएगा कि {fee} आपको सीधे देना है।',
    pa: 'ਕੰਮ ਬੰਦ ਹੋ ਜਾਵੇਗਾ। ਗਾਹਕ ਨੂੰ ਦੱਸਿਆ ਜਾਵੇਗਾ ਕਿ {fee} ਤੁਹਾਨੂੰ ਸਿੱਧਾ ਦੇਣਾ ਹੈ।',
  },
  'The customer’s request goes back to other workers for new quotes. This counts as a cancellation on your record.': {
    hi: 'ग्राहक का अनुरोध नए कोटेशन के लिए दूसरे कारीगरों के पास जाएगा। यह आपके रिकॉर्ड में रद्दीकरण गिना जाएगा।',
    pa: 'ਗਾਹਕ ਦੀ ਬੇਨਤੀ ਨਵੇਂ ਕੋਟੇਸ਼ਨ ਲਈ ਹੋਰ ਕਾਰੀਗਰਾਂ ਕੋਲ ਜਾਵੇਗੀ। ਇਹ ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਵਿੱਚ ਰੱਦ ਕਰਨਾ ਗਿਣਿਆ ਜਾਵੇਗਾ।',
  },
  'The job is closed. This does not count against you.': { hi: 'काम बंद हो जाएगा। यह आपके ख़िलाफ़ नहीं गिना जाएगा।', pa: 'ਕੰਮ ਬੰਦ ਹੋ ਜਾਵੇਗਾ। ਇਹ ਤੁਹਾਡੇ ਖ਼ਿਲਾਫ਼ ਨਹੀਂ ਗਿਣਿਆ ਜਾਵੇਗਾ।' },
  'You have cancelled {count} jobs in the last {days} days. Customers rely on you showing up, and repeated cancellations may be reviewed by our team.': {
    hi: 'आपने पिछले {days} दिनों में {count} काम रद्द किए हैं। ग्राहक आपके आने पर भरोसा करते हैं, और बार-बार रद्द करने की जाँच हमारी टीम कर सकती है।',
    pa: 'ਤੁਸੀਂ ਪਿਛਲੇ {days} ਦਿਨਾਂ ਵਿੱਚ {count} ਕੰਮ ਰੱਦ ਕੀਤੇ ਹਨ। ਗਾਹਕ ਤੁਹਾਡੇ ਆਉਣ ’ਤੇ ਭਰੋਸਾ ਕਰਦੇ ਹਨ, ਅਤੇ ਵਾਰ-ਵਾਰ ਰੱਦ ਕਰਨ ਦੀ ਜਾਂਚ ਸਾਡੀ ਟੀਮ ਕਰ ਸਕਦੀ ਹੈ।',
  },
  'The worker declined your request': { hi: 'कारीगर ने आपका अनुरोध मना कर दिया', pa: 'ਕਾਰੀਗਰ ਨੇ ਤੁਹਾਡੀ ਬੇਨਤੀ ਨਾਮਨਜ਼ੂਰ ਕਰ ਦਿੱਤੀ' },
  'You declined this request': { hi: 'आपने यह अनुरोध मना कर दिया', pa: 'ਤੁਸੀਂ ਇਹ ਬੇਨਤੀ ਨਾਮਨਜ਼ੂਰ ਕਰ ਦਿੱਤੀ' },
  'You did not arrive in time': { hi: 'आप समय पर नहीं पहुँचे', pa: 'ਤੁਸੀਂ ਸਮੇਂ ਸਿਰ ਨਹੀਂ ਪਹੁੰਚੇ' },
  'Your worker did not arrive': { hi: 'आपका कारीगर नहीं पहुँचा', pa: 'ਤੁਹਾਡਾ ਕਾਰੀਗਰ ਨਹੀਂ ਪਹੁੰਚਿਆ' },
  'This request was closed': { hi: 'यह अनुरोध बंद हो गया', pa: 'ਇਹ ਬੇਨਤੀ ਬੰਦ ਹੋ ਗਈ' },
  'You cancelled this job': { hi: 'आपने यह काम रद्द किया', pa: 'ਤੁਸੀਂ ਇਹ ਕੰਮ ਰੱਦ ਕੀਤਾ' },
  'The worker cancelled this job': { hi: 'कारीगर ने यह काम रद्द किया', pa: 'ਕਾਰੀਗਰ ਨੇ ਇਹ ਕੰਮ ਰੱਦ ਕੀਤਾ' },
  'The customer cancelled this job': { hi: 'ग्राहक ने यह काम रद्द किया', pa: 'ਗਾਹਕ ਨੇ ਇਹ ਕੰਮ ਰੱਦ ਕੀਤਾ' },
  'The job was released because you had not arrived. This counts as a cancellation on your record.': {
    hi: 'आप नहीं पहुँचे, इसलिए काम छोड़ दिया गया। यह आपके रिकॉर्ड में रद्दीकरण गिना जाएगा।',
    pa: 'ਤੁਸੀਂ ਨਹੀਂ ਪਹੁੰਚੇ, ਇਸ ਲਈ ਕੰਮ ਛੱਡ ਦਿੱਤਾ ਗਿਆ। ਇਹ ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਵਿੱਚ ਰੱਦ ਕਰਨਾ ਗਿਣਿਆ ਜਾਵੇਗਾ।',
  },
  'The worker did not arrive in time. You can post the request again.': {
    hi: 'कारीगर समय पर नहीं पहुँचा। आप अनुरोध फिर से पोस्ट कर सकते हैं।',
    pa: 'ਕਾਰੀਗਰ ਸਮੇਂ ਸਿਰ ਨਹੀਂ ਪਹੁੰਚਿਆ। ਤੁਸੀਂ ਬੇਨਤੀ ਮੁੜ ਪੋਸਟ ਕਰ ਸਕਦੇ ਹੋ।',
  },
  'The worker you asked for could not take this job. You can choose another worker.': {
    hi: 'जिस कारीगर को आपने बुलाया था वह यह काम नहीं ले सका। आप दूसरा कारीगर चुन सकते हैं।',
    pa: 'ਜਿਸ ਕਾਰੀਗਰ ਨੂੰ ਤੁਸੀਂ ਬੁਲਾਇਆ ਸੀ ਉਹ ਇਹ ਕੰਮ ਨਹੀਂ ਲੈ ਸਕਿਆ। ਤੁਸੀਂ ਹੋਰ ਕਾਰੀਗਰ ਚੁਣ ਸਕਦੇ ਹੋ।',
  },
  'You said no to this request.': { hi: 'आपने इस अनुरोध को मना किया।', pa: 'ਤੁਸੀਂ ਇਸ ਬੇਨਤੀ ਨੂੰ ਨਾਂਹ ਕੀਤੀ।' },
  'Nobody answered in time. You can choose another worker.': { hi: 'समय पर किसी ने जवाब नहीं दिया। आप दूसरा कारीगर चुन सकते हैं।', pa: 'ਸਮੇਂ ਸਿਰ ਕਿਸੇ ਨੇ ਜਵਾਬ ਨਹੀਂ ਦਿੱਤਾ। ਤੁਸੀਂ ਹੋਰ ਕਾਰੀਗਰ ਚੁਣ ਸਕਦੇ ਹੋ।' },
  'The visit fee of ₹{fee} is payable to you directly by the customer. KaamConnect does not handle this money.': {
    hi: '₹{fee} का विज़िट शुल्क ग्राहक आपको सीधे देंगे। KaamConnect यह पैसा नहीं संभालता।',
    pa: '₹{fee} ਦੀ ਵਿਜ਼ਿਟ ਫ਼ੀਸ ਗਾਹਕ ਤੁਹਾਨੂੰ ਸਿੱਧੀ ਦੇਣਗੇ। KaamConnect ਇਹ ਪੈਸਾ ਨਹੀਂ ਸੰਭਾਲਦਾ।',
  },
  'The visit fee of ₹{fee} is payable to the worker directly. KaamConnect does not handle this money.': {
    hi: '₹{fee} का विज़िट शुल्क कारीगर को सीधे देना है। KaamConnect यह पैसा नहीं संभालता।',
    pa: '₹{fee} ਦੀ ਵਿਜ਼ਿਟ ਫ਼ੀਸ ਕਾਰੀਗਰ ਨੂੰ ਸਿੱਧੀ ਦੇਣੀ ਹੈ। KaamConnect ਇਹ ਪੈਸਾ ਨਹੀਂ ਸੰਭਾਲਦਾ।',
  },
  Cancelled: { hi: 'रद्द हो गया', pa: 'ਰੱਦ ਹੋ ਗਿਆ' },
  'The worker has been told.': { hi: 'कारीगर को बता दिया गया है।', pa: 'ਕਾਰੀਗਰ ਨੂੰ ਦੱਸ ਦਿੱਤਾ ਗਿਆ ਹੈ।' },
  'Job released': { hi: 'काम छोड़ा गया', pa: 'ਕੰਮ ਛੱਡਿਆ ਗਿਆ' },
  'The customer has been told and their request is open to other workers again.': {
    hi: 'ग्राहक को बता दिया गया है और उनका अनुरोध फिर से दूसरे कारीगरों के लिए खुला है।',
    pa: 'ਗਾਹਕ ਨੂੰ ਦੱਸ ਦਿੱਤਾ ਗਿਆ ਹੈ ਅਤੇ ਉਹਨਾਂ ਦੀ ਬੇਨਤੀ ਫਿਰ ਹੋਰ ਕਾਰੀਗਰਾਂ ਲਈ ਖੁੱਲ੍ਹੀ ਹੈ।',
  },
  'Job cancelled': { hi: 'काम रद्द हो गया', pa: 'ਕੰਮ ਰੱਦ ਹੋ ਗਿਆ' },
  'The customer has been told.': { hi: 'ग्राहक को बता दिया गया है।', pa: 'ਗਾਹਕ ਨੂੰ ਦੱਸ ਦਿੱਤਾ ਗਿਆ ਹੈ।' },

  // Location permission
  'Open settings': { hi: 'सेटिंग खोलें', pa: 'ਸੈਟਿੰਗ ਖੋਲ੍ਹੋ' },
  'Location is switched off': { hi: 'लोकेशन बंद है', pa: 'ਲੋਕੇਸ਼ਨ ਬੰਦ ਹੈ' },
  'Turn on Location (GPS) in your phone settings so customers can see you coming.': {
    hi: 'फ़ोन की सेटिंग में लोकेशन (GPS) चालू करें ताकि ग्राहक आपको आते हुए देख सकें।',
    pa: 'ਫ਼ੋਨ ਦੀ ਸੈਟਿੰਗ ਵਿੱਚ ਲੋਕੇਸ਼ਨ (GPS) ਚਾਲੂ ਕਰੋ ਤਾਂ ਜੋ ਗਾਹਕ ਤੁਹਾਨੂੰ ਆਉਂਦੇ ਵੇਖ ਸਕਣ।',
  },
  'Location permission is blocked': { hi: 'लोकेशन की अनुमति बंद है', pa: 'ਲੋਕੇਸ਼ਨ ਦੀ ਇਜਾਜ਼ਤ ਬੰਦ ਹੈ' },
  'You blocked location for KaamConnect. Open Settings > Permissions > Location and choose "Allow" so we can show your arrival to the customer.': {
    hi: 'आपने KaamConnect के लिए लोकेशन बंद की है। सेटिंग > अनुमतियाँ > लोकेशन खोलें और "अनुमति दें" चुनें ताकि ग्राहक को आपका आना दिख सके।',
    pa: 'ਤੁਸੀਂ KaamConnect ਲਈ ਲੋਕੇਸ਼ਨ ਬੰਦ ਕੀਤੀ ਹੈ। ਸੈਟਿੰਗ > ਇਜਾਜ਼ਤਾਂ > ਲੋਕੇਸ਼ਨ ਖੋਲ੍ਹੋ ਅਤੇ "ਇਜਾਜ਼ਤ ਦਿਓ" ਚੁਣੋ ਤਾਂ ਜੋ ਗਾਹਕ ਨੂੰ ਤੁਹਾਡਾ ਆਉਣਾ ਦਿਖ ਸਕੇ।',
  },
  'Location not allowed': { hi: 'लोकेशन की अनुमति नहीं', pa: 'ਲੋਕੇਸ਼ਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ' },
  'Without location the customer cannot see you coming and nearby jobs are harder to find. You can allow it any time from the job screen.': {
    hi: 'लोकेशन के बिना ग्राहक आपको आते हुए नहीं देख सकते और आस-पास के काम ढूँढना मुश्किल होता है। आप इसे काम की स्क्रीन से कभी भी चालू कर सकते हैं।',
    pa: 'ਲੋਕੇਸ਼ਨ ਤੋਂ ਬਿਨਾਂ ਗਾਹਕ ਤੁਹਾਨੂੰ ਆਉਂਦੇ ਨਹੀਂ ਵੇਖ ਸਕਦੇ ਅਤੇ ਨੇੜਲੇ ਕੰਮ ਲੱਭਣੇ ਔਖੇ ਹੁੰਦੇ ਹਨ। ਤੁਸੀਂ ਇਸਨੂੰ ਕੰਮ ਦੀ ਸਕ੍ਰੀਨ ਤੋਂ ਕਦੇ ਵੀ ਚਾਲੂ ਕਰ ਸਕਦੇ ਹੋ।',
  },
  'Could not check location': { hi: 'लोकेशन नहीं मिली', pa: 'ਲੋਕੇਸ਼ਨ ਨਹੀਂ ਮਿਲੀ' },
  'Please check that location is on for your phone and try again.': { hi: 'देखें कि फ़ोन की लोकेशन चालू है और दोबारा कोशिश करें।', pa: 'ਵੇਖੋ ਕਿ ਫ਼ੋਨ ਦੀ ਲੋਕੇਸ਼ਨ ਚਾਲੂ ਹੈ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' },

  // Late notices
  'You are late': { hi: 'आप लेट हैं', pa: 'ਤੁਸੀਂ ਲੇਟ ਹੋ' },
  'The customer is waiting. If you have not arrived by {time}, the job is released and counts as a cancellation on your record.': {
    hi: 'ग्राहक इंतज़ार कर रहे हैं। अगर आप {time} तक नहीं पहुँचे, तो काम छोड़ दिया जाएगा और आपके रिकॉर्ड में रद्दीकरण गिना जाएगा।',
    pa: 'ਗਾਹਕ ਉਡੀਕ ਕਰ ਰਹੇ ਹਨ। ਜੇ ਤੁਸੀਂ {time} ਤੱਕ ਨਹੀਂ ਪਹੁੰਚੇ, ਤਾਂ ਕੰਮ ਛੱਡ ਦਿੱਤਾ ਜਾਵੇਗਾ ਅਤੇ ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਵਿੱਚ ਰੱਦ ਕਰਨਾ ਗਿਣਿਆ ਜਾਵੇਗਾ।',
  },
  'Your worker is running late': { hi: 'आपका कारीगर देर से आ रहा है', pa: 'ਤੁਹਾਡਾ ਕਾਰੀਗਰ ਦੇਰ ਨਾਲ ਆ ਰਿਹਾ ਹੈ' },
  'They have not arrived yet. If they have not arrived by {time}, the request is released automatically. You can keep waiting or cancel below.': {
    hi: 'वे अभी तक नहीं पहुँचे। अगर {time} तक नहीं पहुँचे, तो अनुरोध अपने आप छोड़ दिया जाएगा। आप इंतज़ार कर सकते हैं या नीचे से रद्द कर सकते हैं।',
    pa: 'ਉਹ ਹਾਲੇ ਨਹੀਂ ਪਹੁੰਚੇ। ਜੇ {time} ਤੱਕ ਨਹੀਂ ਪਹੁੰਚੇ, ਤਾਂ ਬੇਨਤੀ ਆਪਣੇ ਆਪ ਛੱਡ ਦਿੱਤੀ ਜਾਵੇਗੀ। ਤੁਸੀਂ ਉਡੀਕ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਹੇਠਾਂ ਤੋਂ ਰੱਦ ਕਰ ਸਕਦੇ ਹੋ।',
  },

  // Camera and photos
  'The camera could not open. Close KaamConnect completely (swipe it away in recent apps), open it again and retry.': {
    hi: 'कैमरा नहीं खुल सका। KaamConnect को पूरी तरह बंद करें (हाल के ऐप्स से हटाएँ), फिर खोलें और दोबारा कोशिश करें।',
    pa: 'ਕੈਮਰਾ ਨਹੀਂ ਖੁੱਲ੍ਹ ਸਕਿਆ। KaamConnect ਨੂੰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਬੰਦ ਕਰੋ (ਹਾਲੀਆ ਐਪਾਂ ਤੋਂ ਹਟਾਓ), ਫਿਰ ਖੋਲ੍ਹੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
  'Allow access to your photos to choose a picture.': { hi: 'फ़ोटो चुनने के लिए अपनी फ़ोटो तक पहुँच की अनुमति दें।', pa: 'ਫ਼ੋਟੋ ਚੁਣਨ ਲਈ ਆਪਣੀਆਂ ਫ਼ੋਟੋਆਂ ਤੱਕ ਪਹੁੰਚ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ।' },
  'Allow camera access to take a photo.': { hi: 'फ़ोटो खींचने के लिए कैमरे की अनुमति दें।', pa: 'ਫ਼ੋਟੋ ਖਿੱਚਣ ਲਈ ਕੈਮਰੇ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ।' },

  // Notifications the phone shows
  'New job alerts': { hi: 'नए काम की सूचना', pa: 'ਨਵੇਂ ਕੰਮ ਦੀ ਸੂਚਨਾ' },
  'Rings a bell and vibrates when a new job, a direct request or a confirmed booking arrives.': {
    hi: 'नया काम, सीधा अनुरोध या पक्की बुकिंग आने पर घंटी बजती है और फ़ोन वाइब्रेट होता है।',
    pa: 'ਨਵਾਂ ਕੰਮ, ਸਿੱਧੀ ਬੇਨਤੀ ਜਾਂ ਪੱਕੀ ਬੁਕਿੰਗ ਆਉਣ ’ਤੇ ਘੰਟੀ ਵੱਜਦੀ ਹੈ ਅਤੇ ਫ਼ੋਨ ਵਾਈਬ੍ਰੇਟ ਹੁੰਦਾ ਹੈ।',
  },
  'KaamConnect • trip in progress': { hi: 'KaamConnect • यात्रा जारी है', pa: 'KaamConnect • ਯਾਤਰਾ ਜਾਰੀ ਹੈ' },
  'Tap to come back to the job and enter the arrival code': { hi: 'काम पर लौटने और आगमन कोड डालने के लिए दबाएँ', pa: 'ਕੰਮ ’ਤੇ ਵਾਪਸ ਆਉਣ ਅਤੇ ਆਗਮਨ ਕੋਡ ਪਾਉਣ ਲਈ ਦਬਾਓ' },
  'KaamConnect Trip in Progress': { hi: 'KaamConnect यात्रा जारी है', pa: 'KaamConnect ਯਾਤਰਾ ਜਾਰੀ ਹੈ' },
  'Sharing your live location with the customer': { hi: 'ग्राहक के साथ आपकी लाइव लोकेशन साझा हो रही है', pa: 'ਗਾਹਕ ਨਾਲ ਤੁਹਾਡੀ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਸਾਂਝੀ ਹੋ ਰਹੀ ਹੈ' },

  // Times
  'just now': { hi: 'अभी', pa: 'ਹੁਣੇ' },
  '{n}m ago': { hi: '{n} मिनट पहले', pa: '{n} ਮਿੰਟ ਪਹਿਲਾਂ' },
  '{n}h ago': { hi: '{n} घंटे पहले', pa: '{n} ਘੰਟੇ ਪਹਿਲਾਂ' },
  '{n}d ago': { hi: '{n} दिन पहले', pa: '{n} ਦਿਨ ਪਹਿਲਾਂ' },
  'Today {time}': { hi: 'आज {time}', pa: 'ਅੱਜ {time}' },
  'Tomorrow {time}': { hi: 'कल {time}', pa: 'ਕੱਲ੍ਹ {time}' },

  // Trade picker tabs
  All: { hi: 'सभी', pa: 'ਸਾਰੇ' },
  'Electrical & AC': { hi: 'बिजली व एसी', pa: 'ਬਿਜਲੀ ਅਤੇ ਏਸੀ' },
  'Plumbing & Civil': { hi: 'प्लंबिंग व निर्माण', pa: 'ਪਲੰਬਿੰਗ ਅਤੇ ਉਸਾਰੀ' },
  'Cleaning & Washing': { hi: 'सफाई व धुलाई', pa: 'ਸਫ਼ਾਈ ਅਤੇ ਧੁਆਈ' },
  'Vehicles & Moving': { hi: 'वाहन व शिफ़्टिंग', pa: 'ਵਾਹਨ ਅਤੇ ਸ਼ਿਫ਼ਟਿੰਗ' },
  More: { hi: 'और', pa: 'ਹੋਰ' },
};
