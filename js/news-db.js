/**
 * news-db.js — ระบบฐานข้อมูลข่าวสารและกิจกรรมสำหรับ พุทธอุทยานโชคชัย-บามิยัน
 * รองรับการทำงานผ่าน IndexedDB + LocalStorage แบบ Client-side
 * ทำงานได้ทันทีโดยไม่ต้องพึ่งพาเซิร์ฟเวอร์ภายนอก
 */

(function (window) {
  'use strict';

  const DB_NAME = 'BamiyanNewsDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'articles';
  const LOCAL_STORAGE_KEY = 'bamiyan_news_cache_v1';

  // ข้อมูลเริ่มต้นสำหรับระบบ
  const DEFAULT_NEWS = [
    {
      id: 'news-init-1',
      title: 'พิธีทำบุญปรับพื้นที่โครงการ',
      category: 'ข่าวกิจกรรม',
      date: '22 สิงหาคม 2568',
      excerpt: 'พิธีทำบุญปรับพื้นที่โครงการพุทธอุทยานโชคชัย-บามิยัน สถานธรรมมาตาปิตโร อำเภอโชคชัย จังหวัดนครราชสีมา เพื่อเริ่มดำเนินการก่อสร้างในระยะต่อไป',
      content: 'เมื่อวันที่ ๒๒ สิงหาคม ๒๕๖๘ ทางมูลนิธิสถานธรรมมาตาปิตโร ได้จัดพิธีทำบุญและบวงสรวงปรับพื้นที่โครงการพุทธอุทยานโชคชัย-บามิยัน ณ อำเภอโชคชัย จังหวัดนครราชสีมา โดยมีคณะสงฆ์ คณะกรรมการมูลนิธิ และพุทธศาสนิกชนผู้มีจิตศรัทธาร่วมพิธีอย่างพร้อมเพรียง\n\nการปรับพื้นที่ในระยะนี้ครอบคลุมพื้นที่ก่อสร้างหลัก เพื่อเตรียมการรองรับโครงสร้างผาสลักพระพุทธรูป และศูนย์วิปัสสนากรรมฐานในลำดับถัดไป ขออนุโมทนาบุญกับทุกท่านที่มีส่วนร่วมในมหากุศลครั้งนี้',
      image: '',
      emoji: '🏛️',
      createdAt: 1724284800000
    },
    {
      id: 'news-init-2',
      title: 'ความคืบหน้างานก่อสร้างองค์พระพุทธโชคชัย-บามิยัน',
      category: 'การก่อสร้าง',
      date: '10 พฤษภาคม 2568',
      excerpt: 'อัปเดตความคืบหน้างานก่อสร้างองค์พระประธาน ซึ่งเป็นสัญลักษณ์สำคัญของโครงการพุทธอุทยานโชคชัย-บามิยัน สถานธรรมมาตาปิตโร',
      content: 'รายงานความคืบหน้างานสถาปัตยกรรมและวิศวกรรมโครงสร้างองค์พระประธานโชคชัย-บามิยัน ซึ่งได้รับแรงบันดาลใจจากพุทธศิลป์แห่งบามิยัน โดยทีมสถาปนิกและช่างผู้เชี่ยวชาญได้ดำเนินการสำรวจชั้นหินและวางรากฐานทางวิศวกรรมให้มีความมั่นคงแข็งแรง ปลอดภัยตามมาตรฐานสากล\n\nคาดว่าจะแล้วเสร็จตามแผนแม่บท เพื่อให้เป็นอนุสรณ์แห่งศรัทธาระดับโลกสืบต่อไป',
      image: 'images/arch-bamiyan.jpg',
      emoji: '🏗️',
      createdAt: 1715302400000
    },
    {
      id: 'news-init-3',
      title: 'โครงการบรรพชาสามเณรภาคฤดูร้อน ประจำปี 2568',
      category: 'กิจกรรม',
      date: '5 มกราคม 2568',
      excerpt: 'โครงการบรรพชาสามเณรภาคฤดูร้อน เพื่อปลูกฝังคุณธรรม จริยธรรม และพระพุทธศาสนาให้กับเยาวชน',
      content: 'ขอเชิญชวนเยาวชนและผู้ปกครองร่วมโครงการบรรพชาสามเณรภาคฤดูร้อน ประจำปี ๒๕๖๘ เพื่อฝึกฝนอบรมจิตใจ ศึกษาพระธรรมวินัย และเรียนรู้การปฏิบัติธรรมเบื้องต้นตามแนวทางพุทธศาสนา ณ สถานธรรมมาตาปิตโร\n\nโครงการนี้จัดขึ้นโดยไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้น เพื่อสร้างศาสนทายาทและปลูกฝังคุณธรรมให้เยาวชนเติบโตเป็นคนดีของสังคม',
      image: 'images/arch-landscape.jpg',
      emoji: '📿',
      createdAt: 1704416000000
    }
  ];

  // Helper สำหรับเปิด IndexedDB
  function openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  // ดึงรายการข่าวทั้งหมด
  async function getAllNews() {
    try {
      const db = await openDB();
      if (db) {
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => {
            let list = req.result;
            if (!list || list.length === 0) {
              // ถ้ายังไม่มีข้อมูล ให้ใส่ข้อมูลเริ่มต้น
              initDefaultNews().then(resolve);
            } else {
              // เรียงลำดับตาม createdAt ใหม่สุดอยู่บน
              list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              updateLocalCache(list);
              resolve(list);
            }
          };
          req.onerror = () => {
            resolve(getFromLocalCache());
          };
        });
      }
    } catch (e) {
      console.warn('IndexedDB error, falling back to localStorage:', e);
    }
    return getFromLocalCache();
  }

  // ดึงจาก LocalStorage (Fallback)
  function getFromLocalCache() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage cache:', e);
    }
    // ถ้ายังไม่มี ให้ใช้ค่าเริ่มต้น
    updateLocalCache(DEFAULT_NEWS);
    return [...DEFAULT_NEWS];
  }

  function updateLocalCache(list) {
    try {
      // เซฟข้อมูล (ไม่เซฟ base64 ขนาดยักษ์ใน localStorage ถ้าเกินขีดจำกัด)
      const lightweight = list.map(item => {
        if (item.image && item.image.length > 200000) {
          // เก็บเวอร์ชันย่อ
          return { ...item };
        }
        return item;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, keeping IndexedDB as source of truth.');
    }
  }

  // ใส่ข้อมูลตั้งต้น
  async function initDefaultNews() {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      DEFAULT_NEWS.forEach(item => store.put(item));
      await new Promise(r => tx.oncomplete = r);
    }
    updateLocalCache(DEFAULT_NEWS);
    return [...DEFAULT_NEWS];
  }

  // ดึงข่าวตาม ID
  async function getNewsById(id) {
    const list = await getAllNews();
    return list.find(item => item.id === id) || null;
  }

  // บันทึกหรืออัปเดตข่าว
  async function saveNews(newsItem) {
    if (!newsItem.id) {
      newsItem.id = 'news-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    if (!newsItem.createdAt) {
      newsItem.createdAt = Date.now();
    }
    newsItem.updatedAt = Date.now();

    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(newsItem);
      await new Promise(r => tx.oncomplete = r);
    }

    // อัปเดต Cache
    const all = await getAllNews();
    const idx = all.findIndex(n => n.id === newsItem.id);
    if (idx >= 0) {
      all[idx] = newsItem;
    } else {
      all.unshift(newsItem);
    }
    updateLocalCache(all);

    // แจ้งเตือนการเปลี่ยนแปลง
    window.dispatchEvent(new CustomEvent('bamiyan_news_updated', { detail: { news: newsItem } }));
    return newsItem;
  }

  // ลบข่าว
  async function deleteNews(id) {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      await new Promise(r => tx.oncomplete = r);
    }

    const all = (await getAllNews()).filter(n => n.id !== id);
    updateLocalCache(all);
    window.dispatchEvent(new CustomEvent('bamiyan_news_updated', { detail: { deletedId: id } }));
    return true;
  }

  // ล้างข้อมูลและรีเซ็ตเป็นค่าเริ่มต้น
  async function resetToDefaults() {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      DEFAULT_NEWS.forEach(item => store.put(item));
      await new Promise(r => tx.oncomplete = r);
    }
    updateLocalCache(DEFAULT_NEWS);
    window.dispatchEvent(new CustomEvent('bamiyan_news_updated', { detail: { reset: true } }));
    return [...DEFAULT_NEWS];
  }

  // ส่งออกข้อมูลเป็น JSON
  async function exportNewsJSON() {
    const all = await getAllNews();
    return JSON.stringify(all, null, 2);
  }

  // นำเข้าข้อมูลจาก JSON
  async function importNewsJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error('ข้อมูลไม่ถูกต้องตามรูปแบบ');

    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      parsed.forEach(item => store.put(item));
      await new Promise(r => tx.oncomplete = r);
    }
    updateLocalCache(parsed);
    window.dispatchEvent(new CustomEvent('bamiyan_news_updated', { detail: { imported: true } }));
    return parsed;
  }

  // ฟังก์ชันย่อขนาดภาพผ่าน Canvas เพื่อประสิทธิภาพ
  function compressImage(file, maxWidth = 1280, maxHeight = 800, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ส่งออกโมดูลสู่ Window Object
  window.BamiyanNewsDB = {
    getAllNews,
    getNewsById,
    saveNews,
    deleteNews,
    resetToDefaults,
    exportNewsJSON,
    importNewsJSON,
    compressImage,
    DEFAULT_NEWS
  };

})(window);
