const Client = require('../models/Client');
const Opportunity = require('../models/Opportunity');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { OPP_STATUS, OPEN_STATUS } = require('../models/Opportunity');
const asyncHandler = require('../utils/asyncHandler');

const MONTHS_BACK = 6;

// Indicadores calculados con consultas y agregaciones reales sobre MongoDB.
// Los asesores ven solo sus propios datos; los administradores, todo.
const summary = asyncHandler(async (req, res) => {
  const admin = req.user.role === 'admin';
  const me = req.user._id;
  const sc = {
    client: admin ? {} : { assignedTo: me },
    opp: admin ? {} : { owner: me },
    task: admin ? {} : { assignedTo: me },
    act: admin ? {} : { owner: me },
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_BACK - 1), 1));

  const [totalClients, newClients, oppByStatus, pendingTasks, overdueTasks, recentActivities, clientsMonthly] =
    await Promise.all([
      Client.countDocuments(sc.client),
      Client.countDocuments({ ...sc.client, registeredAt: { $gte: thirtyDaysAgo } }),
      Opportunity.aggregate([
        { $match: sc.opp },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } },
      ]),
      Task.countDocuments({ ...sc.task, status: { $ne: 'completada' } }),
      Task.countDocuments({ ...sc.task, status: { $ne: 'completada' }, dueDate: { $lt: now } }),
      Activity.find(sc.act).sort('-date').limit(8).populate('client', 'fullName').populate('owner', 'name').lean(),
      Client.aggregate([
        { $match: { ...sc.client, registeredAt: { $gte: monthStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$registeredAt' } }, count: { $sum: 1 } } },
      ]),
    ]);

  // Estados sin datos se devuelven en 0 para que los gráficos sean estables.
  const byStatus = Object.fromEntries(OPP_STATUS.map((s) => [s, { count: 0, value: 0 }]));
  oppByStatus.forEach((r) => { byStatus[r._id] = { count: r.count, value: r.value }; });

  const monthMap = Object.fromEntries(clientsMonthly.map((r) => [r._id, r.count]));
  const clientsByMonth = [];
  for (let i = 0; i < MONTHS_BACK; i += 1) {
    const d = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    clientsByMonth.push({ month: key, count: monthMap[key] || 0 });
  }

  const openOpportunities = OPEN_STATUS.reduce((n, s) => n + byStatus[s].count, 0);
  const pipelineValue = OPEN_STATUS.reduce((n, s) => n + byStatus[s].value, 0);
  const won = byStatus.ganada;
  const lost = byStatus.perdida;
  const closed = won.count + lost.count;

  res.json({
    totals: {
      totalClients,
      newClients,
      openOpportunities,
      wonOpportunities: won.count,
      lostOpportunities: lost.count,
      pendingTasks,
      overdueTasks,
    },
    performance: {
      wonValue: won.value,
      pipelineValue,
      winRate: closed ? Math.round((won.count / closed) * 1000) / 10 : 0, // % sobre oportunidades cerradas
    },
    opportunitiesByStatus: OPP_STATUS.map((s) => ({ status: s, ...byStatus[s] })),
    clientsByMonth,
    recentActivities,
  });
});

module.exports = { summary };
