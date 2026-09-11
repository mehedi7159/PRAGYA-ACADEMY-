const fs = require('fs');
let code = fs.readFileSync('src/pages/Students.tsx', 'utf8');

const fatherProfHtml = `
            <div className="space-y-1 md:col-span-1">
              <label className="text-sm font-medium text-slate-700">{language === 'en' ? "Father's Profession" : "বাবার পেশা"}</label>
              <input type="text" name="fatherProfession" value={formData.fatherProfession || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>`;

const dobHtml = `
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{language === 'en' ? "Date of Birth" : "জন্ম তারিখ"}</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>`;

const schoolHtml = `
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">{language === 'en' ? "School / Madrasa" : "স্কুল বা মাদ্রাসার নাম"}</label>
              <input type="text" name="schoolName" value={formData.schoolName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>`;

const subjectHtml = `
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{language === 'en' ? "Favourite Subject" : "পছন্দের বিষয়"}</label>
              <input type="text" name="favouriteSubject" value={formData.favouriteSubject || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{language === 'en' ? "Weak Subject" : "দুর্বল বিষয়"}</label>
              <input type="text" name="weakSubject" value={formData.weakSubject || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>`;

code = code.replace(
  /(<div className="space-y-1">\s*<label className="text-sm font-medium text-slate-700">\{t\.admissionDate\}[\s\S]*?<\/div>)/,
  '$1\n' + dobHtml
);

code = code.replace(
  /(<div className="space-y-1 md:col-span-2">\s*<label className="text-sm font-medium text-slate-700">\{t\.address\}[\s\S]*?<\/div>)/,
  '$1\n' + schoolHtml
);

code = code.replace(
  /(<div className="space-y-1">\s*<label className="text-sm font-medium text-slate-700">\{t\.fatherName\}[\s\S]*?<\/div>)/,
  '$1\n' + fatherProfHtml
);

code = code.replace(
  /(<div className="space-y-1">\s*<label className="text-sm font-medium text-slate-700">\{t\.batchClass\}[\s\S]*?<\/div>)/,
  '$1\n' + subjectHtml
);

fs.writeFileSync('src/pages/Students.tsx', code);
