# Franskaprov kapitel 4

En liten React + TypeScript-app för lokal övning inför franskans kapitel 4. Appen är byggd för att fungera helt utan backend och sparar svaga frågor lokalt i webbläsaren.

## Innehåll i kapitlet

Appen innehåller nu övningar för:

- dagar, familj, sport och aktiviteter
- verbet `faire`
- väder och årstider
- Kanada och Québec
- länder och nationaliteter
- att beskriva personer
- texten `Mes copains`
- sammansatta ord
- tal från 73 upp till 200
- blandat quizläge, separat `Provträning` och separat `Prov på 10 minuter`

## Kom igång

```bash
npm install
npm run dev
```

Bygg appen:

```bash
npm run build
```

Kör tester:

```bash
npm test
```

## Var datan finns

Det mesta ligger i [src/data/chapter4.ts](/Users/erik/Hobbyspace/french-quiz/src/data/chapter4.ts).

Viktiga exporter:

- `flashcards`: alla gloskort
- `faireExercises`: riktade faire-övningar
- `sentenceExercises`: fyll-i-luckor
- `translationExercises`: översättningsövningar
- `quizQuestions`: vanliga quizfrågor
- `miniTestQuestions`: 20-frågors provträning
- `QuizQuestion.testTags`: används för att balansera `Prov på 10 minuter`
- `focusedPracticeModes`: meny för fokusträning
- `studyTips`: förklaringskort och stödtexter

## Lägg till nya glosor

Lägg till ett objekt i `flashcards`:

```ts
{
  id: "country-espagne",
  category: "Länder och nationaliteter",
  french: "l'Espagne",
  swedish: "Spanien",
}
```

Håll varje kort:

- typat
- försett med unikt `id`
- placerat i rätt `category`

Om glosan också ska tränas i skrivövningar eller quiz behöver du lägga till en separat fråga i någon av övningslistorna.

## Lägg till nya quizfrågor

Lägg till ett objekt i `quizQuestions`:

```ts
{
  id: "quiz-country-espagne",
  category: "Länder och nationaliteter",
  type: "text",
  prompt: "Il habite en Espagne. Il est _____.",
  answer: "espagnol",
  explanation: "Nationaliteten står i maskulin form här.",
}
```

Om flera svar ska godtas kan du använda `alternatives`:

```ts
{
  id: "quiz-mescopains-ville",
  category: "Mes copains",
  type: "text",
  prompt: "Où habite Gustay ?",
  answer: "En Suède.",
  alternatives: ["Suède", "En Suede"],
}
```

Om frågan också ska kunna användas i `Prov på 10 minuter` kan du lägga till `testTags`:

```ts
{
  id: "quiz-country-espagne",
  category: "Länder och nationaliteter",
  type: "text",
  prompt: "Il habite en Espagne. Il est _____.",
  answer: "espagnol",
  testTags: ["country"],
}
```

## Hur svag-träning fungerar

Appen använder `localStorage` för att spara sådant som behöver repeteras.

- `chapter4-weak-flashcards`: gloskort markerade som osäkra
- `chapter4-weak-questions`: frågor som sparats manuellt eller besvarats fel
- `chapter4-last-score`: senaste sparade quiz- eller provresultat

Listan byggs i [src/utils/study.ts](/Users/erik/Hobbyspace/french-quiz/src/utils/study.ts) via `buildWeakPracticeList()`.

Flödet är:

1. Eleven markerar en glosa som svag eller svarar fel på en fråga.
2. Frågans eller glosans `id` sparas i `localStorage`.
3. Läget `Fel jag behöver öva på` visar bara dessa objekt i en separat runda.
4. När eleven väljer `Sitter nu` tas posten bort från listan.

## Fokusträning och provträning

Startsidan har två nivåer:

- vanliga lägen: glosor, faire, meningar, quiz, provträning och svaga frågor
- fokusträning: till exempel `Kanada och Québec`, `Länder och nationaliteter`, `Beskriva personer`, `Tal` och `Väder`

Fokusträningen använder samma generiska övningskomponenter men filtrerar datan på `category` i stället för att hårdkoda egna skärmar per ämne.

## Prov på 10 minuter

`Prov på 10 minuter` är ett eget tidsläge och återanvänder inte den vanliga quizkomponenten.

- läget bygger en ny 20-frågorsrunda varje gång
- frågorna hämtas från `quizQuestions`
- urvalet balanseras med `testTags`
- fel och tomma svar sparas i den vanliga svaglistan
- om det finns färre än 20 tillgängliga frågor används alla och appen visar en varning

Taggar som används i det här läget:

- `vocabulary`
- `sentence`
- `faire`
- `weather`
- `country`
- `numbers`
- `comprehension`

Om du vill att en fråga ska kunna dyka upp i det tidsstyrda provet behöver du lägga till rätt `testTags` i objektet i `quizQuestions`.

## Tester

Tester finns i [src/utils/study.test.ts](/Users/erik/Hobbyspace/french-quiz/src/utils/study.test.ts).

De täcker i nuläget:

- filtrering av frågor per kategori
- byggandet av svaglistan
- poängräkning för quizresultat
- skiftlägesokänsliga svar
- trimning av extra whitespace i svar

## GitHub Pages

Deployen styrs av [.github/workflows/deploy-pages.yml](/Users/erik/Hobbyspace/french-quiz/.github/workflows/deploy-pages.yml).

Workflowen gör detta på varje push till `main`:

1. checkar ut repot
2. installerar beroenden med `npm ci`
3. kör `npm run build`
4. laddar upp `dist/` som GitHub Pages-artifact
5. publicerar sajten via `actions/deploy-pages`

Vite-konfigurationen i [vite.config.ts](/Users/erik/Hobbyspace/french-quiz/vite.config.ts) läser `GITHUB_REPOSITORY` under Actions och sätter rätt `base` för GitHub Pages. Lokalt används `/` som basväg.
