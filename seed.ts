import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Trattoria del Sole",
      address: "Via Etnea 142, 95131 Catania CT",
      phone: "+39 095 123 4567",
      email: "info@trattoriadsole.it",
      instagram: "@trattoriadsole",
      tiktok: "@trattoriadsole.ct",
      description: "Cucina siciliana autentica dal 1987. Specialità: pasta alla norma, arancini, pesce fresco dell'Etna.",
      tables: 12,
    },
  });

  // Create menu items - Sicilian cuisine
  const menuItems = [
    { name: "Arancini al Ragù", description: "Riso ripieno di ragù siciliano, piselli e caciocavallo, panatura croccante", price: 5.50, category: "Antipasti", imageEmoji: "🔶", sortOrder: 1 },
    { name: "Caponata Siciliana", description: "Melanzane, sedano, capperi, olive e pomodori in agrodolce", price: 7.00, category: "Antipasti", imageEmoji: "🍆", sortOrder: 2 },
    { name: "Pasta alla Norma", description: "Pasta con melanzane fritte, pomodoro, ricotta salata e basilico", price: 11.00, category: "Primi", imageEmoji: "🍝", sortOrder: 3 },
    { name: "Pasta con le Sarde", description: "Pasta con sarde fresche, finocchietto, uvetta, pinoli e pangrattato", price: 13.00, category: "Primi", imageEmoji: "🐟", sortOrder: 4 },
    { name: "Risotto al Nero di Seppia", description: "Risotto cremoso con nero di seppia e gamberi rossi", price: 14.00, category: "Primi", imageEmoji: "🦑", sortOrder: 5 },
    { name: "Involtini di Pesce Spada", description: "Involtini ripieni di pangrattato, uvetta e pinoli", price: 15.00, category: "Secondi", imageEmoji: "🗡️", sortOrder: 6 },
    { name: "Parmigiana di Melanzane", description: "Melanzane fritte con pomodoro, mozzarella e parmigiano", price: 10.00, category: "Secondi", imageEmoji: "🧀", sortOrder: 7 },
    { name: "Cannoli Siciliani", description: "Cialda croccante ripiena di ricotta di pecora, cioccolato e pistacchio", price: 6.00, category: "Dolci", imageEmoji: "🧁", sortOrder: 8 },
    { name: "Cassata Siciliana", description: "Pan di Spagna, ricotta, canditi e pasta di mandorle", price: 7.50, category: "Dolci", imageEmoji: "🍰", sortOrder: 9 },
    { name: "Granita di Mandorla", description: "Granita tradizionale con brioche siciliana calda", price: 4.50, category: "Dolci", imageEmoji: "🧊", sortOrder: 10 },
    { name: "Vino della Casa (Rosso)", description: "Nero d'Avola DOC Sicilia, bicchiere 15cl", price: 5.00, category: "Bevande", imageEmoji: "🍷", sortOrder: 11 },
    { name: "Birra Artigianale Siciliana", description: "Birra Chiara locale, 33cl", price: 4.50, category: "Bevande", imageEmoji: "🍺", sortOrder: 12 },
    { name: "Acqua Minerale", description: "Naturale o frizzante, 50cl", price: 2.00, category: "Bevande", imageEmoji: "💧", sortOrder: 13 },
    { name: "Espresso Siciliano", description: "Caffè espresso con zucchero di canna", price: 1.50, category: "Bevande", imageEmoji: "☕", sortOrder: 14 },
  ];

  const createdMenuItems = [];
  for (const item of menuItems) {
    const created = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        ...item,
        available: true,
        allergens: item.category === "Dolci" ? "Glutine, Lattosio, Frutta a guscio" : "",
      },
    });
    createdMenuItems.push(created);
  }

  // Create sample orders
  const now = new Date();
  const ordersData = [
    {
      customerName: "Giuseppe Russo",
      customerPhone: "+39 333 456 7890",
      status: "in_cucina",
      total: 28.50,
      notes: "Senza cipolla nell'antipasto",
      source: "whatsapp",
      createdAt: new Date(now.getTime() - 15 * 60000),
      items: [
        { menuItemId: createdMenuItems[0].id, quantity: 2, price: createdMenuItems[0].price, notes: "" },
        { menuItemId: createdMenuItems[2].id, quantity: 1, price: createdMenuItems[2].price, notes: "" },
        { menuItemId: createdMenuItems[10].id, quantity: 1, price: createdMenuItems[10].price, notes: "" },
      ],
    },
    {
      customerName: "Maria Santoro",
      customerPhone: "+39 328 111 2233",
      status: "nuovo",
      total: 35.50,
      notes: "Allergia ai frutti di mare",
      source: "whatsapp",
      createdAt: new Date(now.getTime() - 3 * 60000),
      items: [
        { menuItemId: createdMenuItems[1].id, quantity: 1, price: createdMenuItems[1].price, notes: "" },
        { menuItemId: createdMenuItems[3].id, quantity: 1, price: createdMenuItems[3].price, notes: "Senza uvetta" },
        { menuItemId: createdMenuItems[6].id, quantity: 1, price: createdMenuItems[6].price, notes: "" },
        { menuItemId: createdMenuItems[7].id, quantity: 2, price: createdMenuItems[7].price, notes: "" },
      ],
    },
    {
      customerName: "Antonio Caruso",
      customerPhone: "",
      status: "pronto",
      total: 17.00,
      notes: "",
      source: "banco",
      createdAt: new Date(now.getTime() - 35 * 60000),
      items: [
        { menuItemId: createdMenuItems[4].id, quantity: 1, price: createdMenuItems[4].price, notes: "" },
        { menuItemId: createdMenuItems[9].id, quantity: 1, price: createdMenuItems[9].price, notes: "" },
        { menuItemId: createdMenuItems[13].id, quantity: 1, price: createdMenuItems[13].price, notes: "" },
      ],
    },
    {
      customerName: "Laura Ferrara",
      customerPhone: "+39 347 987 6543",
      status: "consegnato",
      total: 22.00,
      notes: "Tavolo 7",
      source: "sala",
      createdAt: new Date(now.getTime() - 90 * 60000),
      items: [
        { menuItemId: createdMenuItems[0].id, quantity: 1, price: createdMenuItems[0].price, notes: "" },
        { menuItemId: createdMenuItems[5].id, quantity: 1, price: createdMenuItems[5].price, notes: "" },
        { menuItemId: createdMenuItems[8].id, quantity: 1, price: createdMenuItems[8].price, notes: "" },
        { menuItemId: createdMenuItems[12].id, quantity: 2, price: createdMenuItems[12].price, notes: "" },
      ],
    },
  ];

  for (const orderData of ordersData) {
    const { items, ...orderFields } = orderData;
    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        ...orderFields,
        items: { create: items },
      },
    });
  }

  // Create sample reviews
  const reviewsData = [
    {
      platform: "google",
      author: "Marco Bianchi",
      rating: 5,
      text: "Cibo eccezionale! La pasta alla norma è la migliore che abbia mai mangiato a Catania. Personale gentilissimo e ambiente accogliente. Torneremo sicuramente!",
      date: "2026-06-27",
      replied: false,
      replyText: "",
      replyDate: "",
    },
    {
      platform: "tripadvisor",
      author: "Sophie Dupont",
      rating: 4,
      text: "Très bonne expérience, les arancini sont délicieux. Service un peu lent le samedi soir mais la nourriture compense. Je recommande les cannolis!",
      date: "2026-06-25",
      replied: false,
      replyText: "",
      replyDate: "",
    },
    {
      platform: "google",
      author: "Luca Verdi",
      rating: 2,
      text: "Siamo arrivati alle 20:30 e il locale era pieno. Abbiamo aspettato 40 minuti per il primo piatto. Il cibo era buono ma il servizio è da migliorare. Anche il conto era sbagliato.",
      date: "2026-06-24",
      replied: false,
      replyText: "",
      replyDate: "",
    },
    {
      platform: "thefork",
      author: "Anna Rossi",
      rating: 5,
      text: "Prenotato online, tavolo pronto al nostro arrivo. Abbiamo preso il menù degustazione di pesce: tutto freschissimo e presentato bene. Il risotto al nero di seppia è impagabile! Consigliato.",
      date: "2026-06-22",
      replied: true,
      replyText: "Grazie di cuore Anna! Ci fa immenso piacere che abbiate apprezzato il nostro menù di pesce. Il risotto al nero di seppia è uno dei nostri cavalli di battaglia. A presto! Il team della Trattoria del Sole",
      replyDate: "2026-06-23",
    },
    {
      platform: "google",
      author: "Thomas Mueller",
      rating: 3,
      text: "Average Italian restaurant. Food was ok but nothing special compared to other places in Catania. The arancini were good though. Prices are fair.",
      date: "2026-06-20",
      replied: false,
      replyText: "",
      replyDate: "",
    },
    {
      platform: "tripadvisor",
      author: "Francesca Lombardo",
      rating: 1,
      text: "Delusione totale. Abbiamo trovato un capello nel piatto e quando lo abbiamo segnalato il cameriere ci ha ignorato. Il pesce non era fresco. Non torneremo mai più.",
      date: "2026-06-18",
      replied: false,
      replyText: "",
      replyDate: "",
    },
  ];

  for (const review of reviewsData) {
    await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        ...review,
      },
    });
  }

  // Create sample social posts
  const socialPostsData = [
    {
      platform: "instagram",
      type: "reel",
      caption: "La preparazione perfetta dei nostri arancini 🤤 Seguici per i segreti della cucina siciliana!",
      scheduledAt: "",
      status: "pubblicato",
      aiSuggestion: true,
      hashtags: "#arancini #cucinasiciliana #cataniafood #streetfood #sicilia",
    },
    {
      platform: "tiktok",
      type: "video",
      caption: "POV: Quando la nonna ti insegna a fare la pasta alla norma 🍝",
      scheduledAt: "",
      status: "pubblicato",
      aiSuggestion: true,
      hashtags: "#pastanorma #nonna #cucinaitaliana #fyp #catania",
    },
    {
      platform: "instagram",
      type: "storia",
      caption: "Stasera menù speciale a base di pesce fresco! Prenota al 095 123 4567 🐟",
      scheduledAt: "",
      status: "bozza",
      aiSuggestion: true,
      hashtags: "#pescefresco #menùspeciale #catania #prenotaora",
    },
  ];

  for (const post of socialPostsData) {
    await prisma.socialPost.create({
      data: {
        restaurantId: restaurant.id,
        ...post,
      },
    });
  }

  // Create sample reservations
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
  const reservationsData = [
    { customerName: "Famiglia Greco", customerPhone: "+39 339 555 1234", date: today, time: "12:30", guests: 6, notes: "Tavolo vicino alla finestra, compleanno della nonna", status: "confermata" },
    { customerName: "Davide Conti", customerPhone: "+39 345 678 9012", date: today, time: "13:00", guests: 2, notes: "", status: "confermata" },
    { customerName: "Azienda TechSicilia", customerPhone: "+39 095 555 6666", date: today, time: "20:00", guests: 10, notes: "Cena aziendale, possibile bisogno di menu dedicato", status: "in_attesa" },
    { customerName: "Elena Marino", customerPhone: "+39 320 111 4444", date: today, time: "20:30", guests: 4, notes: "Allergia al glutine per 2 persone", status: "confermata" },
    { customerName: "Roberto La Rosa", customerPhone: "", date: tomorrow, time: "12:00", guests: 3, notes: "", status: "confermata" },
    { customerName: "Chiara Puglisi", customerPhone: "+39 328 999 8888", date: tomorrow, time: "21:00", guests: 2, notes: "Tavolo romantico se possibile", status: "confermata" },
  ];

  for (const res of reservationsData) {
    await prisma.reservation.create({
      data: {
        restaurantId: restaurant.id,
        ...res,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`Restaurant: ${restaurant.name}`);
  console.log(`Menu items: ${createdMenuItems.length}`);
  console.log(`Orders: ${ordersData.length}`);
  console.log(`Reviews: ${reviewsData.length}`);
  console.log(`Social posts: ${socialPostsData.length}`);
  console.log(`Reservations: ${reservationsData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });