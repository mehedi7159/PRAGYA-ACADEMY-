import fs from 'fs';

let content = fs.readFileSync('src/pages/Attendance.tsx', 'utf8');

// Replace the teacher logic entirely
const startMarker = `          <AnimatePresence mode="wait">`;
const endMarker = `          </AnimatePresence>`;

// Wait, the AnimatePresence contains the teacher SubViews
// Let's replace the whole `teacherSubView === 'daily'` to look like a table.
// And remove `teacherSubView` tabs altogether, just making it simple.
// I'll regex it out and put a single component for Teacher view.

const teacherTabsRegex = /<div className="flex bg-slate-100 p-1\.5 rounded-2xl border-2 border-slate-50 w-full md:w-auto">[\s\S]*?<\/div>\s*<div className="flex flex-wrap gap-4 w-full md:w-auto">/;
const replacementTabs = `<div className="flex flex-wrap gap-4 w-full md:w-auto">`;

content = content.replace(teacherTabsRegex, replacementTabs);

// Remove the condition for history/overview vs daily inside AnimatePresence:
// Actually, it's safer to rewrite the <motion.div key="daily" ...> content

const teacherViewHtml = `
          <AnimatePresence mode="wait">
              <motion.div 
                key="daily-table"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col mt-6"
              >
                <div className="p-5 md:p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-6">
                  <div className="text-center md:text-left w-full">
                     <h3 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight">{language === 'en' ? 'Teacher Attendance' : 'শিক্ষক হাজিরা'}</h3>
                     <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{teachers.filter(t => t.status === 'Active').length} {language === 'en' ? 'Active Teachers' : 'সক্রিয় শিক্ষক'}</p>
                  </div>
                  <div className="flex w-full md:w-auto gap-2">
                    <button 
                      onClick={() => {
                          const today = selectedDate;
                          teachers.filter(t => t.status === 'Active').forEach(teacher => {
                             const exists = teacherRecords.some(r => r.teacherId === teacher.id && r.date === today);
                             if (!exists) {
                                addTeacherRecord({ id:'T-ATT-'+Date.now()+'-'+teacher.id, teacherId: teacher.id, batchId: 'Global', date: today, startTime: '00:00', endTime: '23:59', topic: 'Daily Attendance', subject: 'General', status: 'Completed' });
                             }
                          });
                          alert(language === 'en' ? 'All marked present!' : 'সবার হাজিরা সম্পন্ন!');
                      }}
                      className="px-4 md:px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 font-black shadow-xl shadow-emerald-200"
                    >
                      <CheckCircle size={16} /> {language === 'en' ? 'Mark All Present' : 'সবাই উপস্থিত'}
                    </button>
                    <button 
                      onClick={() => {
                          const today = selectedDate;
                          teachers.filter(t => t.status === 'Active').forEach(teacher => {
                             const exists = teacherRecords.some(r => r.teacherId === teacher.id && r.date === today);
                             if (!exists) {
                                addTeacherRecord({ id:'T-ATT-'+Date.now()+'-'+teacher.id, teacherId: teacher.id, batchId: 'Global', date: today, startTime: '00:00', endTime: '23:59', topic: 'Daily Attendance', subject: 'General', status: 'Absent' });
                             }
                          });
                      }}
                      className="px-4 py-3 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 font-black"
                    >
                      {language === 'en' ? 'Mark All Absent' : 'সবাই অনুপস্থিত'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-5">Teacher ID</th>
                        <th className="px-8 py-5">Name</th>
                        <th className="px-8 py-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {teachers.filter(t => t.status === 'Active' && (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()))).map(teacher => {
                        // Find if there's any record for today
                        const record = teacherRecords.find(r => r.teacherId === teacher.id && r.date === selectedDate);
                        const status = record ? (record.status === 'Completed' ? 'Present' : record.status) : null;
                        
                        return (
                          <tr key={teacher.id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-8 py-6">
                              <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">{teacher.id}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-indigo-600 text-xl group-hover:border-indigo-200 transition-colors">
                                  {(teacher.name || 'T').charAt(0)}
                                </div>
                                <div className="font-black text-slate-900 text-lg">{teacher.name}</div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center gap-3">
                                <button 
                                  onClick={() => {
                                      if (record) {
                                         // Update existing
                                         deleteTeacherRecord(record.id);
                                      }
                                      addTeacherRecord({ id:'T-ATT-'+Date.now()+'-'+teacher.id, teacherId: teacher.id, batchId: 'Global', date: selectedDate, startTime: '00:00', endTime: '23:59', topic: 'Daily Attendance', subject: 'General', status: 'Completed' });
                                  }}
                                  className={cn(
                                    "w-12 h-12 md:w-auto md:px-6 rounded-2xl transition-all flex items-center justify-center gap-3 border-2 shadow-sm font-black text-xs uppercase tracking-widest",
                                    status === 'Present' 
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-200 scale-105" 
                                      : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200 hover:text-emerald-600"
                                  )}
                                >
                                  <CheckCircle size={20} />
                                  <span className="hidden md:inline">{language === 'en' ? 'Present' : 'উপস্থিত'}</span>
                                </button>
                                <button 
                                  onClick={() => {
                                      if (record) {
                                         deleteTeacherRecord(record.id);
                                      }
                                      addTeacherRecord({ id:'T-ATT-'+Date.now()+'-'+teacher.id, teacherId: teacher.id, batchId: 'Global', date: selectedDate, startTime: '00:00', endTime: '23:59', topic: 'Daily Attendance', subject: 'General', status: 'Absent' });
                                  }}
                                  className={cn(
                                    "w-12 h-12 md:w-auto md:px-6 rounded-2xl transition-all flex items-center justify-center gap-3 border-2 shadow-sm font-black text-xs uppercase tracking-widest",
                                    status === 'Absent' 
                                      ? "bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-200 scale-105" 
                                      : "bg-white text-slate-400 border-slate-100 hover:border-rose-200 hover:text-rose-600"
                                  )}
                                >
                                  <XCircle size={20} />
                                  <span className="hidden md:inline">{language === 'en' ? 'Absent' : 'অনুপস্থিত'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
          </AnimatePresence>
`;

const re = /<AnimatePresence mode="wait">[\s\S]*?<\/AnimatePresence>/;
content = content.replace(re, teacherViewHtml);

// Save back
fs.writeFileSync('src/pages/Attendance.tsx', content);
