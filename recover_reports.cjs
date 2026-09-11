const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const pnlChart = `<ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                            <defs>
                               <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" name="Income" dataKey="Income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" name="Expense" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                         </AreaChart>
                      </ResponsiveContainer>`;

const adminChart = `<ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                               <XAxis dataKey="name" axisLine={false} tickLine={false} />
                               <YAxis axisLine={false} tickLine={false} />
                               <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '1rem' }} />
                               <Bar dataKey="Enrollment" name="New Students" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                         </ResponsiveContainer>`;


code = code.replace(
  /<motion\.div initial=\{\{ opacity: 0, y: 20 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ duration: 0\.5 \}\} className=\"h-80 w-full\">\s*<\/motion\.div>/g,
  '<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80 w-full">\n' + pnlChart + '\n                     </motion.div>'
);

code = code.replace(
  /<motion\.div initial=\{\{ opacity: 0, y: 20 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ duration: 0\.5 \}\} className=\"h-80\">\s*<\/motion\.div>/g,
  '<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-80">\n' + adminChart + '\n                      </motion.div>'
);


fs.writeFileSync('src/pages/Reports.tsx', code);
