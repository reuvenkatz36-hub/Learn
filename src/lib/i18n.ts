// Zendric i18n — English (default) + Hebrew with full RTL.
// The language lives in a cookie so BOTH server components and client
// components render the same language, and <html dir> can be set server-side.

export type Lang = 'en' | 'he'

export const LANG_COOKIE = 'zendric_lang'

export function normalizeLang(v: string | undefined | null): Lang {
  return v === 'he' ? 'he' : 'en'
}

export function dirFor(lang: Lang): 'ltr' | 'rtl' {
  return lang === 'he' ? 'rtl' : 'ltr'
}

type Entry = { en: string; he: string }

const STRINGS = {
  // Nav
  'nav.home': { en: 'Home', he: 'בית' },
  'nav.learn': { en: 'Learn', he: 'לימוד' },
  'nav.coach': { en: 'Coach', he: 'מאמן' },
  'nav.brain': { en: 'Brain', he: 'המוח' },
  'nav.profile': { en: 'Profile', he: 'פרופיל' },
  'nav.settings': { en: 'Settings', he: 'הגדרות' },
  'nav.signout': { en: 'Sign out', he: 'התנתקות' },

  // Dashboard
  'dash.morning': { en: 'Good morning', he: 'בוקר טוב' },
  'dash.afternoon': { en: 'Good afternoon', he: 'צהריים טובים' },
  'dash.evening': { en: 'Good evening', he: 'ערב טוב' },
  'dash.learner': { en: 'Learner', he: 'לומד/ת' },
  'dash.new': { en: 'New', he: 'חדש' },
  'dash.import': { en: 'Import', he: 'ייבוא' },
  'dash.xp': { en: 'XP earned', he: 'נק׳ ניסיון' },
  'dash.streak': { en: 'day streak', he: 'ימי רצף' },
  'dash.lessonsDone': { en: 'lessons done', he: 'שיעורים הושלמו' },
  'dash.yourCourses': { en: 'Your Courses', he: 'הקורסים שלך' },
  'dash.viewAll': { en: 'View all', he: 'הצג הכל' },
  'dash.emptyTitle': { en: 'is ready when you are', he: 'מוכן כשאתם מוכנים' },
  'dash.emptyBody': { en: 'Generate your first course to get started', he: 'צרו את הקורס הראשון שלכם כדי להתחיל' },
  'dash.createFirst': { en: 'Create your first course', he: 'צרו את הקורס הראשון' },
  'dash.explore': { en: 'Explore Topics', he: 'נושאים לגילוי' },
  'dash.lessons': { en: 'lessons', he: 'שיעורים' },

  // Learn / course
  'learn.title': { en: 'Your Courses', he: 'הקורסים שלך' },
  'learn.subtitle': { en: 'keeps your lessons in order', he: 'שומר על הסדר בשיעורים שלך' },
  'learn.courses': { en: 'courses', he: 'קורסים' },
  'learn.course': { en: 'course', he: 'קורס' },
  'learn.empty': { en: 'No courses yet', he: 'אין קורסים עדיין' },
  'learn.emptyBody': { en: 'Head to your dashboard to create one', he: 'עברו לדשבורד כדי ליצור אחד' },
  'learn.goDash': { en: 'Go to Dashboard', he: 'לדשבורד' },
  'learn.back': { en: 'Back', he: 'חזרה' },
  'learn.estimated': { en: 'estimated', he: 'משוער' },
  'learn.start': { en: 'Start', he: 'התחלה' },
  'learn.continue': { en: 'Continue', he: 'המשך' },
  'learn.completedBanner': { en: 'Course complete! Amazing work.', he: 'הקורס הושלם! עבודה מדהימה.' },
  'learn.getCertificate': { en: 'Get your certificate', he: 'קבלו את התעודה' },

  // Lesson screen
  'lesson.tab.lesson': { en: 'Lesson', he: 'שיעור' },
  'lesson.tab.quiz': { en: 'Quiz', he: 'מבחן' },
  'lesson.tab.practice': { en: 'Practice', he: 'תרגול' },
  'lesson.writing': { en: 'is writing your lesson...', he: 'כותב את השיעור שלך...' },
  'lesson.readWhole': { en: 'You read the whole lesson', he: 'קראתם את כל השיעור' },
  'lesson.complete': { en: 'Complete lesson', he: 'סיום שיעור' },
  'lesson.completeTitle': { en: 'Lesson complete', he: 'השיעור הושלם' },
  'lesson.earned': { en: 'You earned', he: 'הרווחתם' },
  'lesson.backToCourse': { en: 'Back to course', he: 'חזרה לקורס' },
  'lesson.mode.spotify': { en: 'Focus', he: 'פוקוס' },
  'lesson.mode.book': { en: 'Book', he: 'ספר' },
  'lesson.mode.plain': { en: 'Plain', he: 'רגיל' },
  'lesson.mode.story': { en: 'Story', he: 'סיפור' },
  'lesson.mode.title': { en: 'Reading mode', he: 'מצב קריאה' },
  'lesson.autoScroll': { en: 'Auto-scroll', he: 'גלילה אוטומטית' },
  'lesson.listen': { en: 'Listen', he: 'האזנה' },
  'lesson.stopListen': { en: 'Stop', he: 'עצירה' },
  'lesson.storyLoading': { en: 'is turning this into a story...', he: 'הופך את זה לסיפור...' },
  'lesson.storyFailed': { en: "Couldn't build the story version", he: 'לא הצלחנו ליצור את גרסת הסיפור' },
  'lesson.tryAgain': { en: 'Try again', he: 'נסו שוב' },
  'lesson.help.title': { en: 'Ask about this lesson', he: 'שאלו על השיעור' },
  'lesson.help.placeholder': { en: "What didn't make sense?", he: 'מה לא היה ברור?' },
  'lesson.help.send': { en: 'Ask', he: 'שליחה' },
  'lesson.ttsNote': { en: 'Voice is English-only for now', he: 'הקראה זמינה כרגע באנגלית בלבד' },

  // Quiz
  'quiz.preparing': { en: 'is preparing your quiz', he: 'מכין לך מבחן' },
  'quiz.subtitle': { en: '5 questions based on this lesson', he: '5 שאלות על השיעור הזה' },
  'quiz.snag': { en: 'hit a snag', he: 'נתקל בבעיה' },
  'quiz.snagBody': { en: "Couldn't prepare your quiz just now", he: 'לא הצלחנו להכין את המבחן כרגע' },
  'quiz.submit': { en: 'Submit Quiz', he: 'הגשת מבחן' },
  'quiz.excellent': { en: 'Excellent', he: 'מצוין' },
  'quiz.good': { en: 'Good job', he: 'עבודה טובה' },
  'quiz.keepGoing': { en: 'Keep going', he: 'ממשיכים הלאה' },

  // Practice
  'practice.preparing': { en: 'is preparing your task', he: 'מכין לך משימה' },
  'practice.subtitle': { en: "Apply what you've learned with a real build", he: 'יישמו את מה שלמדתם במשימה אמיתית' },
  'practice.snagBody': { en: "Couldn't prepare your task just now", he: 'לא הצלחנו להכין את המשימה כרגע' },
  'practice.yourTask': { en: 'Your Task', he: 'המשימה שלך' },
  'practice.placeholder': { en: 'Write your response here...', he: 'כתבו את התשובה כאן...' },
  'practice.submit': { en: 'Submit for Feedback', he: 'הגשה למשוב' },
  'practice.gettingFeedback': { en: 'Getting feedback...', he: 'מקבלים משוב...' },
  'practice.feedback': { en: "'s Feedback", he: ' — משוב' },
  'practice.answerText': { en: 'Write', he: 'כתיבה' },
  'practice.answerDraw': { en: 'Draw', he: 'ציור' },
  'practice.clear': { en: 'Clear', he: 'ניקוי' },
  'practice.drawHint': { en: 'Sketch your answer below', he: 'שרטטו את התשובה למטה' },

  // Brain
  'brain.title': { en: 'Your Brain', he: 'המוח שלך' },
  'brain.subtitle': { en: 'lights up a neuron for every lesson you finish.', he: 'מדליק נוירון על כל שיעור שאתם מסיימים.' },
  'brain.lit': { en: 'brain lit up', he: 'מהמוח מואר' },
  'brain.fired': { en: 'neurons fired', he: 'נוירונים נדלקו' },
  'brain.toLearn': { en: 'still to learn', he: 'נותרו ללמידה' },
  'brain.empty': { en: 'Your brain is empty. Finish a lesson and watch the first neuron light up.', he: 'המוח עדיין ריק. סיימו שיעור וצפו בנוירון הראשון נדלק.' },

  // Profile
  'profile.title': { en: 'Profile', he: 'פרופיל' },
  'profile.level': { en: 'Level', he: 'רמה' },
  'profile.displayName': { en: 'Display Name', he: 'שם תצוגה' },
  'profile.bio': { en: 'Bio', he: 'קצת עליי' },
  'profile.bioPlaceholder': { en: 'Tell us about yourself...', he: 'ספרו לנו על עצמכם...' },
  'profile.save': { en: 'Save Changes', he: 'שמירת שינויים' },
  'profile.saved': { en: 'Saved', he: 'נשמר' },
  'profile.toNext': { en: 'XP to next level', he: 'נק׳ לרמה הבאה' },
  'profile.rewards': { en: 'Rewards', he: 'הישגים' },
  'profile.badge': { en: 'Level badge', he: 'תג רמה' },
  'profile.freeCourse': { en: 'Free course credit', he: 'קרדיט לקורס חינם' },
  'profile.credits': { en: 'course credits', he: 'קרדיטים לקורסים' },

  // Settings
  'settings.title': { en: 'Settings', he: 'הגדרות' },
  'settings.language': { en: 'Language', he: 'שפה' },
  'settings.langNote': { en: 'Interface and new AI content follow this language.', he: 'הממשק ותוכן AI חדש ייווצרו בשפה זו.' },
  'settings.readingMode': { en: 'Preferred reading mode', he: 'מצב קריאה מועדף' },
  'settings.readingNote': { en: 'How lesson text is presented by default.', he: 'איך טקסט השיעור יוצג כברירת מחדל.' },
  'settings.sound': { en: 'Sounds', he: 'צלילים' },
  'settings.soundOn': { en: 'On', he: 'פועל' },
  'settings.soundOff': { en: 'Off', he: 'כבוי' },
  'settings.soundNote': { en: 'Soft interface sounds for taps, reading and wins.', he: 'צלילי ממשק עדינים להקשות, קריאה והצלחות.' },

  // Modals
  'modal.newCourse': { en: 'New Course', he: 'קורס חדש' },
  'modal.willBuild': { en: 'will build it for you', he: 'יבנה אותו בשבילך' },
  'modal.whatLearn': { en: 'What do you want to learn?', he: 'מה תרצו ללמוד?' },
  'modal.topicPlaceholder': { en: 'e.g. Machine Learning, TypeScript, Guitar...', he: 'למשל: פסיכולוגיה, שוק ההון, גיטרה...' },
  'modal.difficulty': { en: 'Difficulty', he: 'רמת קושי' },
  'modal.beginner': { en: 'beginner', he: 'מתחילים' },
  'modal.intermediate': { en: 'intermediate', he: 'בינוני' },
  'modal.advanced': { en: 'advanced', he: 'מתקדם' },
  'modal.generate': { en: 'Generate Course', he: 'יצירת קורס' },
  'modal.generating': { en: 'Generating...', he: 'יוצר...' },
  'modal.importTitle': { en: 'Import a reading', he: 'ייבוא חומר קריאה' },
  'modal.importSub': { en: 'turns it into a lesson + quiz', he: 'יהפוך אותו לשיעור + מבחן' },
  'modal.uploadPdf': { en: 'Upload a PDF', he: 'העלאת PDF' },
  'modal.dropPdf': { en: 'Drop a PDF here or click to browse', he: 'גררו PDF לכאן או לחצו לבחירה' },
  'modal.orPaste': { en: 'or paste text', he: 'או הדביקו טקסט' },
  'modal.pastePlaceholder': { en: 'Paste an article, notes, or any text you want to learn from...', he: 'הדביקו מאמר, סיכומים או כל טקסט שתרצו ללמוד ממנו...' },
  'modal.createLesson': { en: 'Create lesson', he: 'יצירת שיעור' },
  'modal.building': { en: 'Building your lesson...', he: 'בונים את השיעור...' },

  // Level up
  'level.up': { en: 'Level up!', he: 'עליתם רמה!' },
  'level.reached': { en: 'You reached level', he: 'הגעתם לרמה' },
  'level.badgeEarned': { en: 'New badge earned', he: 'תג חדש נפתח' },
  'level.freeCourse': { en: 'You earned a FREE course credit!', he: 'הרווחתם קרדיט לקורס חינם!' },
  'level.keep': { en: 'Keep learning', he: 'להמשיך ללמוד' },

  // Certificate
  'cert.title': { en: 'Certificate of Completion', he: 'תעודת סיום' },
  'cert.completed': { en: 'completed the course', he: 'סיים/ה בהצלחה את הקורס' },
  'cert.share': { en: 'Share', he: 'שיתוף' },
  'cert.save': { en: 'Save image', he: 'שמירת תמונה' },
  'cert.copied': { en: 'Copied!', he: 'הועתק!' },
  'cert.square': { en: 'Square', he: 'ריבוע' },
  'cert.story': { en: 'Story', he: 'סטורי' },
  'cert.congrats': { en: 'Congratulations!', he: 'כל הכבוד!' },
  'cert.lessons': { en: 'lessons', he: 'שיעורים' },

  // Chat
  'chat.placeholder': { en: 'Ask me anything...', he: 'שאלו אותי כל דבר...' },

  // Common
  'common.loading': { en: 'Loading...', he: 'טוען...' },
  'common.close': { en: 'Close', he: 'סגירה' },
} satisfies Record<string, Entry>

export type TKey = keyof typeof STRINGS

export function t(lang: Lang, key: TKey): string {
  return STRINGS[key][lang]
}

/** Convenience: bind a language once. */
export function makeT(lang: Lang) {
  return (key: TKey) => t(lang, key)
}

export type ReadingMode = 'spotify' | 'book' | 'plain' | 'story'
export const READING_MODES: ReadingMode[] = ['spotify', 'book', 'plain', 'story']
