const fs = require('fs');
let code = fs.readFileSync('src/pages/Exams.tsx', 'utf8');

code = code.replace(/filteredExams\.map\(exam => \{/g, 'filteredExams.map((exam, i) => {');
code = code.replace(/key=\{exam\.id\}/g, 'key={`${exam.id}-${i}`}');

code = code.replace(/exams\.map\(e => <option key=\{e\.id\}/g, 'exams.map((e, index) => <option key={`${e.id}-${index}`}');

code = code.replace(/\.map\(student => \{/g, '.map((student, i) => {');
code = code.replace(/<tr key=\{student\.id\}/g, '<tr key={`${student.id}-${i}`}');

fs.writeFileSync('src/pages/Exams.tsx', code);
