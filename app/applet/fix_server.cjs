const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /properties: \{[\s\S]*?address: \{ type: Type\.STRING, description: "Full address" \},\s*\},\s*\},\s*\}/;

const correctCode = `properties: {
              id: { type: Type.STRING, description: "Admission number / Form No (ফরম নং)" },
              admissionDate: { type: Type.STRING, description: "Admission date (ভর্তির তারিখ), format YYYY-MM-DD if possible" },
              name: { type: Type.STRING, description: "Student's full name" },
              fatherName: { type: Type.STRING, description: "Father's name" },
              motherName: { type: Type.STRING, description: "Mother's name" },
              mobile: { type: Type.STRING, description: "Student's mobile number, remove non-digits" },
              guardianMobile: { type: Type.STRING, description: "Guardian's mobile number, remove non-digits" },
              address: { type: Type.STRING, description: "Full address" },
              dateOfBirth: { type: Type.STRING, description: "Student's Date of Birth (জন্ম তারিখ)" },
              schoolName: { type: Type.STRING, description: "School or Madrasa name (স্কুল বা মাদ্রাসার নাম)" },
              fatherProfession: { type: Type.STRING, description: "Father's profession (বাবার পেশা)" },
              favouriteSubject: { type: Type.STRING, description: "Favourite subject (পছন্দের বিষয়)" },
              weakSubject: { type: Type.STRING, description: "Weak subject (দুর্বল বিষয়)" }
            }
          }
        }`;

code = code.replace(regex, correctCode);
fs.writeFileSync('server.ts', code);
