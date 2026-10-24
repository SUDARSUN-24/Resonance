/* RESONANCE language practice — phrase lists by topic.
   Classic script: play.html reads it as window.RSPhrases.

   Adding a language: push another object with the same shape.
     code    short id used to save progress ('th'). Never change it once live.
     lang    speech language for listening and the voice ('th-TH')
     flag, name, native   shown on the language chip
     topics  [{ id, icon, name, native, phrases: [{ text, roman, mean, q?, alt? }] }]
       text   the phrase as shown, spoken and scored
       roman  how to say it, in plain Latin letters
       mean   what it means in English
       q      true for a question (only matters for languages with polite forms)
       alt    other ways a recogniser may write the same words (digits, spellings)
     polite  optional: the choices for a polite ending ({ id, native, label }), plus form(phrase, choice)
             which returns { text, roman, alt, gender } for the chosen ending.
   Progress is saved under phrase.text, so editing a phrase's text resets its progress. */
(function (root) {
  /* Thai: men end polite sentences with ครับ (khrap), women with ค่ะ (kha),
     or คะ (kha) in questions and after นะ. Phrases are written with ครับ. */
  function thaiForm(p, choice) {
    const kha = choice === 'kha';
    const show = function (s) { return kha ? s.replace(/นะครับ/g, 'นะคะ').replace(/ครับ/g, p.q ? 'คะ' : 'ค่ะ') : s; };
    // Accept either ending, or none: recognisers often drop it or pick the other tone
    const ways = function (s) { return [s, s.replace(/ครับ/g, 'ค่ะ'), s.replace(/ครับ/g, 'คะ'), s.replace(/\s*ครับ/g, '')]; };
    const text = show(p.text), seen = {}, alt = [];
    [p.text].concat(p.alt || []).forEach(function (s) {
      ways(s).forEach(function (w) { w = w.trim(); if (w && w !== text && !seen[w]) { seen[w] = 1; alt.push(w); } });
    });
    return { text: text, roman: kha ? p.roman.replace(/\bkhrap\b/g, 'kha') : p.roman, alt: alt, gender: kha ? 'female' : 'male' };
  }

  root.RSPhrases = [
    {
      code: 'th', lang: 'th-TH', flag: '🇹🇭', name: 'Thai', native: 'ภาษาไทย',
      polite: { label: 'I SAY', choices: [{ id: 'khrap', native: 'ครับ', label: 'KHRAP' }, { id: 'kha', native: 'ค่ะ', label: 'KHA' }], form: thaiForm },
      topics: [
        { id: 'greetings', icon: '👋', name: 'Greetings', native: 'ทักทาย', phrases: [
          { text: 'สวัสดีครับ', roman: 'sa-wat-dee khrap', mean: 'Hello' },
          { text: 'สบายดีไหมครับ', roman: 'sa-baai dee mai khrap', mean: 'How are you?', q: true },
          { text: 'สบายดี ขอบคุณครับ', roman: 'sa-baai dee, khop-khun khrap', mean: 'I’m fine, thank you' },
          { text: 'คุณชื่ออะไรครับ', roman: 'khun chue a-rai khrap', mean: 'What’s your name?', q: true },
          { text: 'ยินดีที่ได้รู้จักครับ', roman: 'yin-dee tee dai roo-jak khrap', mean: 'Nice to meet you' },
          { text: 'ไปไหนมาครับ', roman: 'bpai nai maa khrap', mean: 'Where have you been? (a friendly hello)', q: true },
          { text: 'แล้วพบกันใหม่ครับ', roman: 'laew phop gan mai khrap', mean: 'See you again' },
          { text: 'ลาก่อนครับ', roman: 'laa gon khrap', mean: 'Goodbye' }
        ] },
        { id: 'polite', icon: '🙏', name: 'Polite basics', native: 'คำสุภาพ', phrases: [
          { text: 'ขอบคุณมากครับ', roman: 'khop-khun maak khrap', mean: 'Thank you very much' },
          { text: 'ขอโทษครับ', roman: 'kho-thot khrap', mean: 'Sorry / Excuse me' },
          { text: 'ไม่เป็นไรครับ', roman: 'mai bpen rai khrap', mean: 'No problem / Never mind' },
          { text: 'ไม่เข้าใจครับ', roman: 'mai khao-jai khrap', mean: 'I don’t understand' },
          { text: 'พูดช้าลงหน่อยได้ไหมครับ', roman: 'phuut chaa long noi dai mai khrap', mean: 'Could you speak a little slower?', q: true },
          { text: 'พูดภาษาอังกฤษได้ไหมครับ', roman: 'phuut phaa-saa ang-grit dai mai khrap', mean: 'Can you speak English?', q: true },
          { text: 'ห้องน้ำอยู่ที่ไหนครับ', roman: 'hong-naam yuu tee-nai khrap', mean: 'Where is the toilet?', q: true },
          { text: 'ช่วยหน่อยได้ไหมครับ', roman: 'chuay noi dai mai khrap', mean: 'Could you help me?', q: true }
        ] },
        { id: 'food', icon: '🍜', name: 'Food and drink', native: 'อาหาร', phrases: [
          { text: 'ขอเมนูหน่อยครับ', roman: 'kho meh-nuu noi khrap', mean: 'The menu, please' },
          { text: 'ขอน้ำเปล่าครับ', roman: 'kho naam bplao khrap', mean: 'Plain water, please' },
          { text: 'ขอผัดไทยครับ', roman: 'kho phat thai khrap', mean: 'Pad thai, please', alt: ['ขอผัดไทครับ'] },
          { text: 'ไม่เผ็ดครับ', roman: 'mai phet khrap', mean: 'Not spicy, please' },
          { text: 'เผ็ดนิดหน่อยครับ', roman: 'phet nit-noi khrap', mean: 'A little spicy' },
          { text: 'มีอาหารมังสวิรัติไหมครับ', roman: 'mee aa-haan mang-sa-wi-rat mai khrap', mean: 'Do you have vegetarian food?', q: true },
          { text: 'อร่อยมากครับ', roman: 'a-roi maak khrap', mean: 'Very delicious' },
          { text: 'เช็คบิลด้วยครับ', roman: 'chek bin duay khrap', mean: 'The bill, please', alt: ['เช็กบิลด้วยครับ'] }
        ] },
        { id: 'shopping', icon: '🛍️', name: 'Shopping', native: 'ซื้อของ', phrases: [
          { text: 'อันนี้เท่าไหร่ครับ', roman: 'an nee thao-rai khrap', mean: 'How much is this?', q: true, alt: ['อันนี้เท่าไรครับ'] },
          { text: 'แพงไปหน่อยครับ', roman: 'phaeng bpai noi khrap', mean: 'It’s a bit too expensive' },
          { text: 'ลดได้ไหมครับ', roman: 'lot dai mai khrap', mean: 'Can you give me a discount?', q: true },
          { text: 'มีสีอื่นไหมครับ', roman: 'mee see uen mai khrap', mean: 'Do you have other colours?', q: true },
          { text: 'มีขนาดใหญ่กว่านี้ไหมครับ', roman: 'mee kha-naat yai gwaa nee mai khrap', mean: 'Do you have a bigger size?', q: true },
          { text: 'ขอดูก่อนครับ', roman: 'kho duu gon khrap', mean: 'Just looking for now' },
          { text: 'เอาอันนี้ครับ', roman: 'ao an nee khrap', mean: 'I’ll take this one' },
          { text: 'จ่ายด้วยบัตรได้ไหมครับ', roman: 'jaai duay bat dai mai khrap', mean: 'Can I pay by card?', q: true }
        ] },
        { id: 'travel', icon: '🚕', name: 'Getting around', native: 'การเดินทาง', phrases: [
          { text: 'ไปสนามบินครับ', roman: 'bpai sa-naam-bin khrap', mean: 'To the airport, please' },
          { text: 'เปิดมิเตอร์ได้ไหมครับ', roman: 'bpoet mi-toe dai mai khrap', mean: 'Can you turn on the meter?', q: true },
          { text: 'ตรงไปครับ', roman: 'trong bpai khrap', mean: 'Go straight on' },
          { text: 'เลี้ยวซ้ายครับ', roman: 'liao saai khrap', mean: 'Turn left' },
          { text: 'เลี้ยวขวาครับ', roman: 'liao khwaa khrap', mean: 'Turn right' },
          { text: 'จอดตรงนี้ครับ', roman: 'jot trong nee khrap', mean: 'Stop here, please' },
          { text: 'สถานีรถไฟฟ้าอยู่ที่ไหนครับ', roman: 'sa-thaa-nee rot-fai-faa yuu tee-nai khrap', mean: 'Where is the skytrain station?', q: true },
          { text: 'ไกลไหมครับ', roman: 'glai mai khrap', mean: 'Is it far?', q: true }
        ] },
        { id: 'numbers', icon: '🔢', name: 'Numbers and money', native: 'ตัวเลข', phrases: [
          { text: 'หนึ่ง สอง สาม', roman: 'neung, song, saam', mean: 'One, two, three', alt: ['1 2 3', '123'] },
          { text: 'ห้าสิบบาท', roman: 'haa-sip baat', mean: 'Fifty baht', alt: ['50 บาท', '50บาท'] },
          { text: 'หนึ่งร้อยบาท', roman: 'neung roi baat', mean: 'One hundred baht', alt: ['100 บาท', '100บาท', 'ร้อยบาท'] },
          { text: 'ราคาสองร้อยห้าสิบบาท', roman: 'raa-khaa song roi haa-sip baat', mean: 'The price is 250 baht', alt: ['ราคา 250 บาท', 'ราคา250บาท'] },
          { text: 'หนึ่งพันบาท', roman: 'neung phan baat', mean: 'One thousand baht', alt: ['1000 บาท', '1,000 บาท', 'พันบาท'] },
          { text: 'กี่บาทครับ', roman: 'gee baat khrap', mean: 'How many baht?', q: true },
          { text: 'มีเงินทอนไหมครับ', roman: 'mee ngoen thon mai khrap', mean: 'Do you have change?', q: true },
          { text: 'สองคนครับ', roman: 'song khon khrap', mean: 'Two people, please (a table for two)', alt: ['2 คนครับ'] }
        ] },
        { id: 'health', icon: '🆘', name: 'Help and health', native: 'ฉุกเฉิน', phrases: [
          { text: 'ช่วยด้วย', roman: 'chuay duay', mean: 'Help!' },
          { text: 'ไม่สบายครับ', roman: 'mai sa-baai khrap', mean: 'I don’t feel well' },
          { text: 'ปวดหัวครับ', roman: 'bpuat hua khrap', mean: 'I have a headache' },
          { text: 'แพ้ถั่วครับ', roman: 'phae thua khrap', mean: 'I’m allergic to nuts' },
          { text: 'ร้านขายยาอยู่ที่ไหนครับ', roman: 'raan khaai yaa yuu tee-nai khrap', mean: 'Where is the pharmacy?', q: true },
          { text: 'โรงพยาบาลอยู่ที่ไหนครับ', roman: 'rong-pha-yaa-baan yuu tee-nai khrap', mean: 'Where is the hospital?', q: true },
          { text: 'เรียกรถพยาบาลด้วยครับ', roman: 'riak rot-pha-yaa-baan duay khrap', mean: 'Please call an ambulance' },
          { text: 'หลงทางครับ', roman: 'long thaang khrap', mean: 'I’m lost' }
        ] },
        { id: 'chat', icon: '💬', name: 'Small talk', native: 'คุยเล่น', phrases: [
          { text: 'มาจากไหนครับ', roman: 'maa jaak nai khrap', mean: 'Where are you from?', q: true },
          { text: 'พูดไทยได้นิดหน่อยครับ', roman: 'phuut thai dai nit-noi khrap', mean: 'I can speak a little Thai' },
          { text: 'ชอบเมืองไทยมากครับ', roman: 'chop mueang thai maak khrap', mean: 'I really like Thailand' },
          { text: 'อากาศร้อนมากครับ', roman: 'aa-gaat ron maak khrap', mean: 'It’s very hot' },
          { text: 'ทำงานอะไรครับ', roman: 'tham-ngaan a-rai khrap', mean: 'What do you do for work?', q: true },
          { text: 'สนุกมากครับ', roman: 'sa-nuk maak khrap', mean: 'It’s really fun' },
          { text: 'เก่งมากครับ', roman: 'geng maak khrap', mean: 'You’re really good!' },
          { text: 'โชคดีนะครับ', roman: 'chok dee na khrap', mean: 'Good luck!' }
        ] }
      ]
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
