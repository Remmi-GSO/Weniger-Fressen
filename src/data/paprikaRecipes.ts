import { type CustomRecipe } from '../db/db';

/**
 * 39 Master-Rezepte aus Paprika (Torten, Kuchen, herzhafte Gerichte, Familienrezepte)
 * Jedes Rezept ist als vollstndiges Gesamtgericht mit Gesamtgewicht und Gesamtkalorien
 * hinterlegt und kann grammgenau oder anteilig (1/1, 1/2, 1/4, 1 Stck etc.) verbucht werden.
 */
export const PAPRIKA_RECIPES: CustomRecipe[] = [
  {
    "name": "Ameisenkuchen Vom Blech",
    "category": "bread",
    "ingredients": [
      {
        "name": "300 g Butter",
        "amountGrams": 300,
        "calories": 2151,
        "protein": 2.1,
        "carbs": 2.1,
        "fat": 243.3,
        "fiber": 0,
        "sugar": 2.1
      },
      {
        "name": "300 g Zucker",
        "amountGrams": 300,
        "calories": 1161,
        "protein": 0,
        "carbs": 300,
        "fat": 0,
        "fiber": 0,
        "sugar": 300
      },
      {
        "name": "2 Pck. Vanillinzucker",
        "amountGrams": 16,
        "calories": 62,
        "protein": 0,
        "carbs": 15.7,
        "fat": 0,
        "fiber": 0,
        "sugar": 15.7
      },
      {
        "name": "4 Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "300 g Mehl (Weizenmehl)",
        "amountGrams": 300,
        "calories": 1029,
        "protein": 30.9,
        "carbs": 213,
        "fat": 3,
        "fiber": 9.6,
        "sugar": 2.1
      },
      {
        "name": "3 TL, gehäuft Backpulver",
        "amountGrams": 15,
        "calories": 15,
        "protein": 0.8,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "300 ml Eierlikör",
        "amountGrams": 300,
        "calories": 429,
        "protein": 37.8,
        "carbs": 2.1,
        "fat": 28.5,
        "fiber": 0,
        "sugar": 2.1
      },
      {
        "name": "150 g Schokostreusel (Zartbitter)",
        "amountGrams": 150,
        "calories": 690,
        "protein": 8.3,
        "carbs": 97.5,
        "fat": 30,
        "fiber": 6,
        "sugar": 90
      },
      {
        "name": "200 g Kuvertüre, weiß",
        "amountGrams": 200,
        "calories": 1070,
        "protein": 10,
        "carbs": 104,
        "fat": 66,
        "fiber": 14,
        "sugar": 96
      },
      {
        "name": "10 g Kokosfett",
        "amountGrams": 10,
        "calories": 15,
        "protein": 0.4,
        "carbs": 2,
        "fat": 0.5,
        "fiber": 0.1,
        "sugar": 0.3
      },
      {
        "name": "Schokostreusel (Vollmilch und Zartbitter)",
        "amountGrams": 100,
        "calories": 64,
        "protein": 3.3,
        "carbs": 4.8,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 4.8
      }
    ],
    "instructions": [
      "Für den Rührteig Butter mit Handrührgerät auf höchster Stufe geschmeidig rühren. Nach und nach Zucker und Vanillinzucker unterrühren. So lange rühren, bis eine gebundene Masse entstanden ist. Eier nach und nach unterrühren (jedes Ei etwa 30 Sekunden). Mehl mit Backpulver mischen, sieben und portionsweise auf mittlerer Stufe unterrühren. Eierlikör und Schokostreusel unterrühren. Den Teig auf ein mit Backpapier ausgelegtes Backblech (38 x 28 cm) streichen.",
      "An der offenen Seite des Backblechs das Papier unmittelbar vor dem Teig zur Falte knicken, sodass ein Rand entsteht. Teig im vorgeheizten Backofen bei 180°C Ober-/Unterhitze (160°C Heißluft, Stufe 2-3 bei Gas) 15–20 Minuten backen. Kuchen erkalten lassen.",
      "Für den Guss Kuvertüre grob zerkleinern und mit dem Kokosfett in einem kleinen Topf im Wasserbad bei schwacher Hitze zu einer geschmeidigen Masse verrühren. Den erkalteten Kuchen mit gut 2/3 von dem Guss besteichen. Den restlichen Guss auf einer Platte ausgießen, fest werden lassen und zu Locken schaben. Den Kuchen mit Kuvertürelocken und Schokostreusel garnieren."
    ],
    "imageUrl": "recipes/da3f52a3-55d1-40a9-8b96-c46594cdded5.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1911,
    "cookedWeight": 1720,
    "servingName": "1 Stück (1/16)",
    "servingWeightGrams": 108,
    "calories100g": 407,
    "protein100g": 7.1,
    "carbs100g": 43.4,
    "fat100g": 23,
    "fiber100g": 1.7,
    "sugar100g": 29.9,
    "createdAt": 1791626514018
  },
  {
    "name": "Auberginen-Kartoffelauflauf mit Garnelen",
    "category": "meal",
    "ingredients": [
      {
        "name": "3 große Auberginen",
        "amountGrams": 300,
        "calories": 75,
        "protein": 3,
        "carbs": 18,
        "fat": 0.6,
        "fiber": 9,
        "sugar": 10.5
      },
      {
        "name": "10 Mittelgroße Kartoffeln (20Pkt)",
        "amountGrams": 1000,
        "calories": 770,
        "protein": 20,
        "carbs": 175,
        "fat": 1,
        "fiber": 22,
        "sugar": 8
      },
      {
        "name": "300 gr. Garnelen (6Pkt)",
        "amountGrams": 300,
        "calories": 297,
        "protein": 72,
        "carbs": 0.6,
        "fat": 0.9,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "250 gr. Schafskäse 45% (6Pkt)",
        "amountGrams": 250,
        "calories": 660,
        "protein": 35,
        "carbs": 2.5,
        "fat": 52.5,
        "fiber": 0,
        "sugar": 2.5
      },
      {
        "name": "2 Knoblauchzehen",
        "amountGrams": 6,
        "calories": 9,
        "protein": 0.4,
        "carbs": 2,
        "fat": 0,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "60 gr. Gouda  (6Pkt)",
        "amountGrams": 60,
        "calories": 214,
        "protein": 15,
        "carbs": 0,
        "fat": 16.2,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 TL Olivenöl (2Pkt)",
        "amountGrams": 10,
        "calories": 88,
        "protein": 0,
        "carbs": 0,
        "fat": 10,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 Dosen gehackte Tomaten",
        "amountGrams": 800,
        "calories": 160,
        "protein": 8,
        "carbs": 32,
        "fat": 1.6,
        "fiber": 9.6,
        "sugar": 20.8
      },
      {
        "name": "WW: 40 Pkt",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Kartoffeln Kochen",
      "Auberginen würfeln und schichtweise salzen. 20 Minuten ziehen lassen, auswaschen und durch ein Handtuch das Wasser leicht auspressen.",
      "Knoblauch mit Garnelen in der Pfanne anbraten, bis die Flüssigkeit eingekocht ist.",
      "Auberginen in der Pfanne mit 2 TL Olivenöl so anbraten, dass die Auberginen leicht bräunen.",
      "Alles zusammen mit den Kartoffeln (in kleine Würfel oder Schnitze schneiden) in einen großen Topf geben, Schafskäse im Topf zerbröseln.",
      "Alles so lange kochen lassen, bis die Kartoffeln gar sind.",
      "Alles in eine große Auflaufform geben, mit einer ganz dünnen Schicht Gouda überbröseln und für eine halbe Stunde abgedeckt in den Ofen. Die letzten 10 Minuten ohne Deckel."
    ],
    "imageUrl": "recipes/0a115e60-4976-4d1f-bb95-8b823097970b.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 2826,
    "cookedWeight": 2826,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 707,
    "calories100g": 86,
    "protein100g": 5.6,
    "carbs100g": 8.8,
    "fat100g": 3.1,
    "fiber100g": 1.5,
    "sugar100g": 1.6,
    "createdAt": 1791626514020
  },
  {
    "name": "Bechamel - Sauce",
    "category": "meal",
    "ingredients": [
      {
        "name": "300 ml Milch",
        "amountGrams": 300,
        "calories": 192,
        "protein": 9.9,
        "carbs": 14.4,
        "fat": 10.8,
        "fiber": 0,
        "sugar": 14.4
      },
      {
        "name": "1 Lorbeerblatt",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "25 g Butter",
        "amountGrams": 25,
        "calories": 179,
        "protein": 0.2,
        "carbs": 0.2,
        "fat": 20.3,
        "fiber": 0,
        "sugar": 0.2
      },
      {
        "name": "25 g Mehl",
        "amountGrams": 25,
        "calories": 86,
        "protein": 2.6,
        "carbs": 17.8,
        "fat": 0.3,
        "fiber": 0.8,
        "sugar": 0.2
      },
      {
        "name": "Muskat",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "Salz und Pfeffer",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      }
    ],
    "instructions": [
      "Milch und Lorbeerblatt in einem Topf langsam zum Kochen bringen und vom Feuer nehmen. Die Butter in einem anderen Topf zerlassen. Das Mehl hineinstreuen und auf kleiner Hitze 1 - 2 Minuten anschwitzen, dabei gut rühren. Das Mehl darf nicht bräunen. Den Topf vom Feuer nehmen.",
      "Das Lorbeerblatt aus der Milch nehmen. Nach und nach die Milch in die Mehlschwitze geben und immer wieder glatt rühren, um jede Klümpchenbildung zu vermeiden. Langsam zum Kochen bringen und weiter unter ständigem Rühren weiterkochen, bis die Soße dick wird. 2 - 3 Minuten auf kleinster Hitze weiterkochen lassen, mit Muskat und Gewürzen abschmecken."
    ],
    "imageUrl": "recipes/928073d6-cd23-4af1-94b6-702db29a11c6.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 650,
    "cookedWeight": 650,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 163,
    "calories100g": 73,
    "protein100g": 2,
    "carbs100g": 5.2,
    "fat100g": 4.9,
    "fiber100g": 0.2,
    "sugar100g": 2.4,
    "createdAt": 1791626514020
  },
  {
    "name": "Belgische Waffeln",
    "category": "bread",
    "ingredients": [
      {
        "name": "1 kg Mehl",
        "amountGrams": 1000,
        "calories": 3430,
        "protein": 103,
        "carbs": 710,
        "fat": 10,
        "fiber": 32,
        "sugar": 7
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "3 Pck. Vanillinzucker",
        "amountGrams": 24,
        "calories": 94,
        "protein": 0,
        "carbs": 23.5,
        "fat": 0,
        "fiber": 0,
        "sugar": 23.5
      },
      {
        "name": "7 Ei(er)",
        "amountGrams": 385,
        "calories": 551,
        "protein": 48.5,
        "carbs": 2.7,
        "fat": 36.6,
        "fiber": 0,
        "sugar": 2.7
      },
      {
        "name": "600 g Butter, zerlassene",
        "amountGrams": 600,
        "calories": 4302,
        "protein": 4.2,
        "carbs": 4.2,
        "fat": 486.6,
        "fiber": 0,
        "sugar": 4.2
      },
      {
        "name": "2 Würfel Hefe, frische (ersatzweise 4 Pck. Trockenhefe)",
        "amountGrams": 110,
        "calories": 110,
        "protein": 5.5,
        "carbs": 22,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Tasse Milch, lauwarme",
        "amountGrams": 100,
        "calories": 64,
        "protein": 3.3,
        "carbs": 4.8,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 4.8
      },
      {
        "name": "1 Tasse Wasser",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "500 g Zucker",
        "amountGrams": 500,
        "calories": 1935,
        "protein": 0,
        "carbs": 500,
        "fat": 0,
        "fiber": 0,
        "sugar": 500
      }
    ],
    "instructions": [
      "Das Mehl mit dem Vanillinzucker und dem Salz in eine Schüssel geben und vermischen. Die Hefe zerbröseln und in der lauwarmen Milch auflösen. Die Eier, die Hefemilch, das Wasser und die Butter zum Mehl geben, alles vermischen und den Teig einige Minuten schlagen. Den Teig eine halbe Stunde zugedeckt an einem warmen Ort gehen lassen.",
      "Nach dem Ruhen, den Zucker unter den Teig rühren und die Waffeln sofort im Waffeleisen (vorzugsweise für rechteckige Waffeln) ausbacken."
    ],
    "imageUrl": "recipes/614f68bd-66b6-4133-bc23-8c46341f23d8.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2919,
    "cookedWeight": 2627,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 219,
    "calories100g": 400,
    "protein100g": 6.3,
    "carbs100g": 48.3,
    "fat100g": 20.4,
    "fiber100g": 1.2,
    "sugar100g": 20.7,
    "createdAt": 1791626514020
  },
  {
    "name": "Blätterteig - Schnecken",
    "category": "snack",
    "ingredients": [
      {
        "name": "1 Pkt. Blätterteig (Kühlregal)",
        "amountGrams": 55,
        "calories": 220,
        "protein": 3.3,
        "carbs": 20.9,
        "fat": 13.8,
        "fiber": 1.1,
        "sugar": 0.6
      },
      {
        "name": "100 g Kochschinken",
        "amountGrams": 100,
        "calories": 110,
        "protein": 20,
        "carbs": 1,
        "fat": 3,
        "fiber": 0,
        "sugar": 1
      },
      {
        "name": "100 g Käse, geriebener",
        "amountGrams": 100,
        "calories": 356,
        "protein": 25,
        "carbs": 0,
        "fat": 27,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1/2 Becher Schmand",
        "amountGrams": 100,
        "calories": 240,
        "protein": 2.4,
        "carbs": 3.5,
        "fat": 24,
        "fiber": 0,
        "sugar": 3.5
      },
      {
        "name": "Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "Pfeffer",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "Knoblauchgranulat",
        "amountGrams": 100,
        "calories": 149,
        "protein": 6.4,
        "carbs": 33,
        "fat": 0.5,
        "fiber": 2.1,
        "sugar": 1
      },
      {
        "name": "Schnittlauch",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Blätterteigrolle ausrollen, mit Schmand bestreichen und nach Geschmack würzen. Schinken würfeln und zusammen mit dem Käse auf dem Schmand verteilen. Blätterteig vom der breiten Seite her fest aufrollen (geht prima, wenn das Ganze auf einem Küchentuch liegt) und in fingerdicke Scheiben schneiden. Diese auf ein mit Backpapier ausgelegtes Blech legen. Im vorgeheizten Backofen bei 180 °C ca. 25 - 30 Minuten backen.",
      "Esther: \"Anstatt dem Schmanddip (s.o.) eignet sich genauso gut ein Paket KraeuterBrunch der mittel dünn oder mitteldick ;) aufgestrichen wird. Ich benutze zudem gerne Gauda und mische diesen ein bissl mit Emmentaler. Oben auf die Minischnecken  streue ich zum Schluss ein wenig geriebenen Gauda. 200 Grad, untere Schiene,  25-30 min sind für meinen Backofen optimal! \"",
      "Die Schnecken lassen sich prima vorbereiten und schmecken auch kalt sehr gut. Dazu passt ein kühles Glas Weißwein und ein Knoblauchdipp."
    ],
    "imageUrl": "recipes/b16a94e3-f65a-438c-adb7-e2947a98edb5.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#snack"
    ],
    "totalRawWeight": 755,
    "cookedWeight": 680,
    "servingName": "1 Stück",
    "servingWeightGrams": 57,
    "calories100g": 182,
    "protein100g": 9,
    "carbs100g": 11.7,
    "fat100g": 10.8,
    "fiber100g": 0.6,
    "sugar100g": 1.4,
    "createdAt": 1791626514020
  },
  {
    "name": "Bohnengulasch",
    "category": "meal",
    "ingredients": [
      {
        "name": "2 Dosen Gulaschsuppe (Aldi)",
        "amountGrams": 800,
        "calories": 480,
        "protein": 28,
        "carbs": 36,
        "fat": 24,
        "fiber": 6.4,
        "sugar": 12
      },
      {
        "name": "4 mittelgroße Kartoffeln",
        "amountGrams": 400,
        "calories": 308,
        "protein": 8,
        "carbs": 70,
        "fat": 0.4,
        "fiber": 8.8,
        "sugar": 3.2
      },
      {
        "name": "1 Tüte gefrorene grüne Bohnen",
        "amountGrams": 250,
        "calories": 78,
        "protein": 4.5,
        "carbs": 17.5,
        "fat": 0.5,
        "fiber": 6.8,
        "sugar": 3.8
      },
      {
        "name": "2 Paprika",
        "amountGrams": 300,
        "calories": 93,
        "protein": 3,
        "carbs": 18,
        "fat": 0.9,
        "fiber": 6.3,
        "sugar": 12.6
      },
      {
        "name": "1 Zwiebel",
        "amountGrams": 80,
        "calories": 32,
        "protein": 0.9,
        "carbs": 7.4,
        "fat": 0.1,
        "fiber": 1.4,
        "sugar": 3.4
      },
      {
        "name": "1 TL Olivenöl",
        "amountGrams": 5,
        "calories": 44,
        "protein": 0,
        "carbs": 0,
        "fat": 5,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Tomatenmark",
        "amountGrams": 100,
        "calories": 20,
        "protein": 1,
        "carbs": 4,
        "fat": 0.2,
        "fiber": 1.2,
        "sugar": 2.6
      },
      {
        "name": "Evtl. Spritzer Curryketchup",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Paprika und Zwiebel mit 1 Teelöffel Olivenöl angeschmort",
      "Grüne Bohnen und Kartoffeln Kochen",
      "Alles zusammen!"
    ],
    "imageUrl": "recipes/fb93c2aa-ef31-4ba6-90e1-3bce56cf6fe6.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 2035,
    "cookedWeight": 2035,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 509,
    "calories100g": 59,
    "protein100g": 2.4,
    "carbs100g": 8.5,
    "fat100g": 1.8,
    "fiber100g": 1.6,
    "sugar100g": 2,
    "createdAt": 1791626514021
  },
  {
    "name": "Butterbier",
    "category": "drink",
    "ingredients": [
      {
        "name": "1 gestrichenen TL Butter",
        "amountGrams": 100,
        "calories": 717,
        "protein": 0.7,
        "carbs": 0.7,
        "fat": 81.1,
        "fiber": 0,
        "sugar": 0.7
      },
      {
        "name": "1-2 El braunen Zucker",
        "amountGrams": 100,
        "calories": 387,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0,
        "sugar": 100
      },
      {
        "name": "1 El Weißen Zucker",
        "amountGrams": 15,
        "calories": 58,
        "protein": 0,
        "carbs": 15,
        "fat": 0,
        "fiber": 0,
        "sugar": 15
      },
      {
        "name": "0.5 l erwärmte Milch",
        "amountGrams": 500,
        "calories": 320,
        "protein": 16.5,
        "carbs": 24,
        "fat": 18,
        "fiber": 0,
        "sugar": 24
      },
      {
        "name": "1tl Vanille",
        "amountGrams": 5,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Sprühsahne",
        "amountGrams": 100,
        "calories": 292,
        "protein": 2.4,
        "carbs": 3.2,
        "fat": 30,
        "fiber": 0,
        "sugar": 3.2
      }
    ],
    "instructions": [
      "Butterbier mit Karamell (alkoholfrei): 1 gestrichenen TL Butter in einem Topf zerlassen, 1-2 El braunen und 1 Tl weißen Zucker darin karamellisieren lassen, mit 0,5 l leicht erwärmter Milch aufgießen, 1 tl Vanille einrühren. Mit einem Schneebesen schaumig schlagen. Nicht kochen! warm servieren.",
      "Butterbier mit Karamell (alkoholfrei): 1 gestrichenen TL Butter in einem Topf zerlassen, 1-2 El braunen und 1 Tl weißen Zucker darin karamellisieren lassen, mit 0,5 l leicht erwärmter Milch aufgießen, 1 tl Vanille einrühren. Mit einem Schneebesen schaumig schlagen. Sprühsahne obendrauf platzieren. Fertig! Nicht kochen! warm servieren."
    ],
    "imageUrl": "recipes/b1d62049-d5e1-4c9e-a884-8a2aa10b9756.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#drink"
    ],
    "totalRawWeight": 820,
    "cookedWeight": 820,
    "servingName": "1 Glas (ca. 250ml)",
    "servingWeightGrams": 410,
    "calories100g": 216,
    "protein100g": 2.4,
    "carbs100g": 17.4,
    "fat100g": 15.7,
    "fiber100g": 0,
    "sugar100g": 17.4,
    "createdAt": 1791626514021
  },
  {
    "name": "Dreilagige Schokotorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "4 Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "100 g Zucker, fein",
        "amountGrams": 100,
        "calories": 387,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0,
        "sugar": 100
      },
      {
        "name": "75 g Mehl",
        "amountGrams": 75,
        "calories": 257,
        "protein": 7.7,
        "carbs": 53.3,
        "fat": 0.8,
        "fiber": 2.4,
        "sugar": 0.5
      },
      {
        "name": "1/4 TL Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "25 g Kakaopulver, bitter",
        "amountGrams": 25,
        "calories": 80,
        "protein": 5,
        "carbs": 3.5,
        "fat": 3.5,
        "fiber": 7.5,
        "sugar": 0.3
      },
      {
        "name": "75 ml Milch",
        "amountGrams": 75,
        "calories": 48,
        "protein": 2.5,
        "carbs": 3.6,
        "fat": 2.7,
        "fiber": 0,
        "sugar": 3.6
      },
      {
        "name": "1 EL Bailey's Irish Cream",
        "amountGrams": 15,
        "calories": 23,
        "protein": 0.6,
        "carbs": 3,
        "fat": 0.8,
        "fiber": 0.2,
        "sugar": 0.5
      },
      {
        "name": "1 EL Honig",
        "amountGrams": 15,
        "calories": 46,
        "protein": 0,
        "carbs": 12.4,
        "fat": 0,
        "fiber": 0,
        "sugar": 12.3
      },
      {
        "name": "100 ml Sahne",
        "amountGrams": 100,
        "calories": 292,
        "protein": 2.4,
        "carbs": 3.2,
        "fat": 30,
        "fiber": 0,
        "sugar": 3.2
      },
      {
        "name": "110 g Schokolade, zartbitter, gute Qualität",
        "amountGrams": 110,
        "calories": 589,
        "protein": 8.3,
        "carbs": 63.8,
        "fat": 33,
        "fiber": 2.2,
        "sugar": 62.7
      },
      {
        "name": "225 g Schokolade, weiße",
        "amountGrams": 225,
        "calories": 1204,
        "protein": 16.9,
        "carbs": 130.5,
        "fat": 67.5,
        "fiber": 4.5,
        "sugar": 128.3
      },
      {
        "name": "600 ml Crème double",
        "amountGrams": 600,
        "calories": 900,
        "protein": 24,
        "carbs": 120,
        "fat": 30,
        "fiber": 6,
        "sugar": 18
      },
      {
        "name": "Für die Glasur: (Ganache)",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "350 g Schokolade, zartbitter, gute Qualität",
        "amountGrams": 350,
        "calories": 1873,
        "protein": 26.3,
        "carbs": 203,
        "fat": 105,
        "fiber": 7,
        "sugar": 199.5
      },
      {
        "name": "100 ml Crème double",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Den Ofen auf 170 Grad Ober/Unterhitze vorheizen. Eine 23 cm Springform einfetten.",
      "Eier und Zucker zusammen 5 Minuten lang schaumig schlagen bis die Masse dick und pastellfarben ist. Mehl, Backpulver und Kakao vermischen, über die Schaummasse sieben und unterheben. Die Masse in die Springform geben und ca. 30 Minuten lang backen (mit Holzspieß testen, er sollte sauber aus dem Teig kommen). Aus dem Ofen nehmen, 5 Minuten in der Form erkalten lassen, dann die Springform entfernen und den Biskuit vollständig auskühlen lassen.",
      "Milch, Honig und Baileys bei schwacher Hitze in einem Topf erhitzen.",
      "Die Springform reinigen und wieder zusammensetzen. Mit Klarsichtfolie auskleiden (wird vor allem am Rand benötigt) und darauf achten, dass etwas von der Folie über den Rand hängt. Jetzt den Biskuit mit einem Messer horizontal durchschneiden, sodass man 2 dünnere Tortenböden erhält.",
      "Einen der Böden in die saubere Springform geben und die Hälfte der Milch-Baileys-Sauce gleichmäßig darüber träufeln.",
      "Nun die Füllung herstellen: Die Sahne auf zwei Metallschüsseln (kommen über Wasserdampf, daher kein Plastik verwenden) verteilen, 50 ml pro Schüssel. In eine Schüssel die dunkle in die andere die weiße Schokolade geben. Beide Schokosahnemassen sollen nun über heißem Dampf etwas erhitzt werden, so dass die Schokolade schmilzt. Am besten nacheinander machen, das ist nicht so stressig. Unter Rühren die Schokolade in der Sahne schmelzen und dann abkühlen lassen.",
      "Wenn beide Schokomassen abgekühlt sind, die Creme double etwas aufschlagen, dann gleichmäßig auf beide Schokomischungen verteilen und unterheben.",
      "Nun die Hälfte der weißen Schokomasse auf dem Boden in der Springform verstreichen, dann die gesamte dunkle Schokomasse darauf geben, gefolgt von der zweiten Hälfte der weißen Schokomasse. Mit dem zweiten Tortenboden bedecken, darauf die restliche Milch-Baileys-Sauce geben. Mit der überhängenden Klarsichtfolie bedecken und über Nacht in den Kühlschrank stellen.",
      "Für die Ganache die dunkle Schokolade mit der Sahne über heißem Wasser schmelzen, abkühlen lassen. Die Torte aus dem Kühlschrank holen und aus der Springform nehmen. Auf eine Tortenplatte stellen und mit der Glasur bestreichen. Dazu am besten die Glasur in die Mitte gießen und mit einem Messer verstreichen. Sie ist relativ dickflüssig und lässt sich daher gut verteilen. Nochmals kalt stellen, damit die Glasur fest werden kann.",
      "Die Torte in möglichst viele Stücke schneiden, da sie so mächtig ist. Aber absolut köstlich. Genau das Richtige für Schokoholiker."
    ],
    "imageUrl": "recipes/b4f3b75b-e6c5-4945-b8bc-2de78b27b90a.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2210,
    "cookedWeight": 1989,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 166,
    "calories100g": 322,
    "protein100g": 6.8,
    "carbs100g": 38.1,
    "fat100g": 15.3,
    "fiber100g": 1.6,
    "sugar100g": 27,
    "createdAt": 1791626514021
  },
  {
    "name": "Eierlikör - Torte",
    "category": "bread",
    "ingredients": [
      {
        "name": "100 g Schokolade (Zartbitter)",
        "amountGrams": 100,
        "calories": 535,
        "protein": 7.5,
        "carbs": 58,
        "fat": 30,
        "fiber": 2,
        "sugar": 57
      },
      {
        "name": "5 Ei(er)",
        "amountGrams": 275,
        "calories": 393,
        "protein": 34.7,
        "carbs": 1.9,
        "fat": 26.1,
        "fiber": 0,
        "sugar": 1.9
      },
      {
        "name": "80 g Butter",
        "amountGrams": 80,
        "calories": 574,
        "protein": 0.6,
        "carbs": 0.6,
        "fat": 64.9,
        "fiber": 0,
        "sugar": 0.6
      },
      {
        "name": "100 g Zucker",
        "amountGrams": 100,
        "calories": 387,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0,
        "sugar": 100
      },
      {
        "name": "1 EL Rum, 2 EL Eierlikör",
        "amountGrams": 15,
        "calories": 21,
        "protein": 1.9,
        "carbs": 0.1,
        "fat": 1.4,
        "fiber": 0,
        "sugar": 0.1
      },
      {
        "name": "200 g Mandel(n), gemahlen",
        "amountGrams": 200,
        "calories": 300,
        "protein": 8,
        "carbs": 40,
        "fat": 10,
        "fiber": 2,
        "sugar": 6
      },
      {
        "name": "2 Becher Sahne",
        "amountGrams": 400,
        "calories": 1168,
        "protein": 9.6,
        "carbs": 12.8,
        "fat": 120,
        "fiber": 0,
        "sugar": 12.8
      },
      {
        "name": "2 Pck. Sahnesteif",
        "amountGrams": 16,
        "calories": 47,
        "protein": 0.4,
        "carbs": 0.5,
        "fat": 4.8,
        "fiber": 0,
        "sugar": 0.5
      },
      {
        "name": "2 Pck. Vanillezucker",
        "amountGrams": 16,
        "calories": 62,
        "protein": 0,
        "carbs": 15.7,
        "fat": 0,
        "fiber": 0,
        "sugar": 15.7
      },
      {
        "name": "2 EL Eierlikör",
        "amountGrams": 30,
        "calories": 43,
        "protein": 3.8,
        "carbs": 0.2,
        "fat": 2.9,
        "fiber": 0,
        "sugar": 0.2
      },
      {
        "name": "1/2 Pck. Schokoladenraspel",
        "amountGrams": 100,
        "calories": 535,
        "protein": 7.5,
        "carbs": 58,
        "fat": 30,
        "fiber": 2,
        "sugar": 57
      }
    ],
    "instructions": [
      "Schokolade reiben, Eier trennen. Fett, Zucker und Eigelb cremig schlagen. Rum, 2 EL Eierlikör, Mandeln und Schokolade zufügen, untermengen. Eiweiß steif schlagen und unterheben. Ca 30 Minuten bei 175 Grad backen.",
      "Erkalteten Boden mit geschlagener Sahne (mit Sahnesteif und Vanillezucker) bestreichen, Rand mit Sahnetupfen verzieren, in die Mitte den restlichen Eierlikör streichen. Rand mit Schokoraspeln verzieren."
    ],
    "imageUrl": "recipes/12f39330-8713-43a4-84aa-43117dafcce3.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1332,
    "cookedWeight": 1199,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 100,
    "calories100g": 339,
    "protein100g": 6.2,
    "carbs100g": 24,
    "fat100g": 24.2,
    "fiber100g": 0.5,
    "sugar100g": 21,
    "createdAt": 1791626514021
  },
  {
    "name": "Engelchens Erdbeer - Eistorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "250 g Frischkäse 1% Fett (es geht natürlich auch der normale)",
        "amountGrams": 250,
        "calories": 175,
        "protein": 27.5,
        "carbs": 11.3,
        "fat": 2,
        "fiber": 0,
        "sugar": 11.3
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "150 g Baiser",
        "amountGrams": 150,
        "calories": 585,
        "protein": 6,
        "carbs": 138,
        "fat": 0.8,
        "fiber": 0,
        "sugar": 135
      },
      {
        "name": "140 g Schokolade, (Zartbitter oder Vollmilch)",
        "amountGrams": 140,
        "calories": 90,
        "protein": 4.6,
        "carbs": 6.7,
        "fat": 5,
        "fiber": 0,
        "sugar": 6.7
      },
      {
        "name": "1 kg Erdbeeren, frische",
        "amountGrams": 1000,
        "calories": 320,
        "protein": 7,
        "carbs": 77,
        "fat": 3,
        "fiber": 20,
        "sugar": 49
      },
      {
        "name": "4 Flaschen Cremefine zum Schlagen",
        "amountGrams": 400,
        "calories": 600,
        "protein": 16,
        "carbs": 80,
        "fat": 20,
        "fiber": 4,
        "sugar": 12
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      }
    ],
    "instructions": [
      "Den Frischkäse mit dem Zucker verrühren. Die Baisers in einen Gefrierbeutel geben und mit einem Nudelholz grob zerbröseln. Die Schokolade klein hacken und mit den Baiserbröseln zur Frischkäsecreme geben. Die Erdbeeren putzen (etwa 5-10 schöne Beeren für die Dekoration beiseite legen), würfeln und vorsichtig untermischen. Cremefine mit Vanillezucker steif schlagen und unterziehen.",
      "Alles in eine Springform (26er) geben und ca. 12 Stunden gefrieren lassen.",
      "Die Eistorte mit den zurückgelegten Erdbeeren garnieren und sofort servieren.",
      "Sie lässt sich am besten mit einem elekrischen Messer oder einem in heißes Wasser getauchten Messer schneiden.",
      "Man kann die Erdbeeren auch durch anderes Obst ersetzen, z.B. Himbeeren, Johannisbeeren, Brombeeren, Heidelbeeren, Stachelbeeren, Nektarinen oder Pflaumen."
    ],
    "imageUrl": "recipes/cc85fc6c-3502-43a7-a253-164bbfb44553.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2098,
    "cookedWeight": 1888,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 157,
    "calories100g": 126,
    "protein100g": 3.2,
    "carbs100g": 24.9,
    "fat100g": 1.6,
    "fiber100g": 1.3,
    "sugar100g": 19.7,
    "createdAt": 1791626514021
  },
  {
    "name": "Frische Himbeertorte Mit Schmand",
    "category": "bread",
    "ingredients": [
      {
        "name": "4 Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "4 EL Wasser, heißes",
        "amountGrams": 60,
        "calories": 3,
        "protein": 0.1,
        "carbs": 0.3,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "175 g Zucker",
        "amountGrams": 175,
        "calories": 677,
        "protein": 0,
        "carbs": 175,
        "fat": 0,
        "fiber": 0,
        "sugar": 175
      },
      {
        "name": "1 Pkt. Vanillezucker",
        "amountGrams": 100,
        "calories": 390,
        "protein": 0,
        "carbs": 98,
        "fat": 0,
        "fiber": 0,
        "sugar": 98
      },
      {
        "name": "125 g Mehl",
        "amountGrams": 125,
        "calories": 429,
        "protein": 12.9,
        "carbs": 88.8,
        "fat": 1.3,
        "fiber": 4,
        "sugar": 0.9
      },
      {
        "name": "75 g Speisestärke",
        "amountGrams": 75,
        "calories": 263,
        "protein": 0.4,
        "carbs": 64.5,
        "fat": 0.1,
        "fiber": 0.4,
        "sugar": 0
      },
      {
        "name": "1 TL Backpulver",
        "amountGrams": 5,
        "calories": 5,
        "protein": 0.3,
        "carbs": 1,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "600 g Himbeeren, tiefgefrorene",
        "amountGrams": 600,
        "calories": 312,
        "protein": 7.2,
        "carbs": 72,
        "fat": 4.2,
        "fiber": 39,
        "sugar": 26.4
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "400 g Schmand",
        "amountGrams": 400,
        "calories": 960,
        "protein": 9.6,
        "carbs": 14,
        "fat": 96,
        "fiber": 0,
        "sugar": 14
      },
      {
        "name": "400 ml Schlagsahne",
        "amountGrams": 400,
        "calories": 1168,
        "protein": 9.6,
        "carbs": 12.8,
        "fat": 120,
        "fiber": 0,
        "sugar": 12.8
      },
      {
        "name": "1/2 Zitrone(n), den Saft davon",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      },
      {
        "name": "2 Pkt. Sahnesteif",
        "amountGrams": 110,
        "calories": 321,
        "protein": 2.6,
        "carbs": 3.5,
        "fat": 33,
        "fiber": 0,
        "sugar": 3.5
      },
      {
        "name": "2 Pkt. Tortenguss, rot, mit Zucker",
        "amountGrams": 200,
        "calories": 774,
        "protein": 0,
        "carbs": 200,
        "fat": 0,
        "fiber": 0,
        "sugar": 200
      }
    ],
    "instructions": [
      "Den Boden einer Springform (28 cm) ausfetten und mit Semmelbrösel",
      "bestreuen (überflüssige Brösel ausschütten) oder mit Backpapier belegen und Papier fetten.",
      "Die Eier trennen. Eigelbe und Wasser zu einem dicken Schaum verrühren. Eischnee steif schlagen, 1 EL Zucker (von der Gesamtmenge) dazu, bis er gelöst ist. Den restlichen Zucker langsam in die Eigelbmasse einrieseln lassen, bis er sich ebenfalls gelöst hat. Den Eischnee auf die Eigelbmasse häufen. Mehl, Backpulver und Speisestärke darüber sieben und alles vorsichtig unterheben.",
      "In die Form füllen und bei 170 -180 °C auf der mittleren Schiebeleiste 20 - 25 min. backen. Der Teig sollte nicht zu dunkel werden, dann lieber eine niedrigere Temperatur wählen. Danach 10 min. in der Form abkühlen lassen, den Rand der Springform entfernen und den Kuchen auf ein Gitter stürzen. Boden vorsichtig lösen. 8 - 10 Std. stehen lassen und dann durchschneiden.",
      "Tipp: Wenn man den Boden seitlich rundherum ca. 1 cm tief einschneidet, in die Schnittstelle einen starken Nähfaden legt und ihn dann langsam über Kreuz zuzieht, bekommt man zwei perfekte halbe Tortenböden (von denen man einen in Alufolie einfrieren kann und der bei der nächsten Torte in 15 Minuten aufgetaut ist).",
      "Den nicht eingefrorenen Tortenboden auf eine Kuchenplatte legen, einen Tortenring darum legen. Sahne mit einem Pkt. Sahnesteif steif schlagen. In einer anderen Schüssel Schmand mit Zucker und Zitronensaft verrühren. Die Sahne unter die Schmand-Zucker-Zitronenmasse heben. Alles auf den Tortenboden geben und über Nacht in den Kühlschrank stellen.",
      "Am nächsten Morgen 2 Pkt. roten Tortenguss nach Anweisung zubereiten. Eine Minute abkühlen lassen.",
      "Derweil gefrorene Himbeeren in eine Schüssel geben, ein Pkt. Sahnesteif darüber streuen, vermengen und dann die Himbeeren auf die Schmandmasse legen. Heißen Guss gleichmäßig über die Himbeeren verteilen. Abkühlen lassen. Fertig!"
    ],
    "imageUrl": "recipes/3695b423-7f30-40d0-a505-7f8510c56d29.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2720,
    "cookedWeight": 2448,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 204,
    "calories100g": 254,
    "protein100g": 2.9,
    "carbs100g": 36.4,
    "fat100g": 11.3,
    "fiber100g": 1.9,
    "sugar100g": 28,
    "createdAt": 1791626514021
  },
  {
    "name": "Fruchtige Heidelbeertorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "3 m.-große Ei(er)",
        "amountGrams": 165,
        "calories": 236,
        "protein": 20.8,
        "carbs": 1.2,
        "fat": 15.7,
        "fiber": 0,
        "sugar": 1.2
      },
      {
        "name": "70 g Zucker",
        "amountGrams": 70,
        "calories": 271,
        "protein": 0,
        "carbs": 70,
        "fat": 0,
        "fiber": 0,
        "sugar": 70
      },
      {
        "name": "100 g Mehl",
        "amountGrams": 100,
        "calories": 343,
        "protein": 10.3,
        "carbs": 71,
        "fat": 1,
        "fiber": 3.2,
        "sugar": 0.7
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "3 TL, gestr. Backpulver",
        "amountGrams": 15,
        "calories": 15,
        "protein": 0.8,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Glas Heidelbeeren",
        "amountGrams": 200,
        "calories": 114,
        "protein": 1.4,
        "carbs": 29,
        "fat": 0.6,
        "fiber": 4.8,
        "sugar": 20
      },
      {
        "name": "12 Heidelbeeren, frisch",
        "amountGrams": 660,
        "calories": 376,
        "protein": 4.6,
        "carbs": 95.7,
        "fat": 2,
        "fiber": 15.8,
        "sugar": 66
      },
      {
        "name": "200 g Puderzucker",
        "amountGrams": 200,
        "calories": 778,
        "protein": 0,
        "carbs": 200,
        "fat": 0,
        "fiber": 0,
        "sugar": 200
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "1 EL Zitronensaft, frisch gepresst",
        "amountGrams": 15,
        "calories": 4,
        "protein": 0.2,
        "carbs": 1.4,
        "fat": 0,
        "fiber": 0.4,
        "sugar": 0.4
      },
      {
        "name": "1 kg Magerquark",
        "amountGrams": 1000,
        "calories": 670,
        "protein": 120,
        "carbs": 40,
        "fat": 2,
        "fiber": 0,
        "sugar": 40
      },
      {
        "name": "12 Blatt Gelatine",
        "amountGrams": 1200,
        "calories": 1800,
        "protein": 48,
        "carbs": 240,
        "fat": 60,
        "fiber": 12,
        "sugar": 36
      },
      {
        "name": "400 ml Sahne",
        "amountGrams": 400,
        "calories": 1168,
        "protein": 9.6,
        "carbs": 12.8,
        "fat": 120,
        "fiber": 0,
        "sugar": 12.8
      },
      {
        "name": "1 Pkt. Tortenguss - Fix",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "250 ml Saft, (Heidelbeersaft)",
        "amountGrams": 250,
        "calories": 375,
        "protein": 10,
        "carbs": 50,
        "fat": 12.5,
        "fiber": 2.5,
        "sugar": 7.5
      },
      {
        "name": "200 ml Sahne",
        "amountGrams": 200,
        "calories": 584,
        "protein": 4.8,
        "carbs": 6.4,
        "fat": 60,
        "fiber": 0,
        "sugar": 6.4
      }
    ],
    "instructions": [
      "Für den Biskuitboden die Eier mit Zucker und Vanillezucker schaumig rühren. Mehl mit Backpulver mischen, auf die Eiercreme sieben und vorsichtig unterheben. Den Teig In eine mit Backpapier ausgelegte Springform füllen und im vorgeheizten Herd auf mittlerer Schiene ca. 25 Minuten backen.",
      "Für die Creme den Quark in eine Schüssel geben. Die Heidelbeeren abgießen und den Saft für den Spiegel beiseite stellen. Die Heidelbeeren mit Zucker, Vanillezucker und Zitronensaft pürieren und unter den Quark rühren. Wer mag, kann die pürierten Heidelbeeren auch durch ein Sieb streichen.",
      "Die Gelatine einweichen und anschließend in einem kleinen Topf auf dem Herd erwärmen und auflösen, sofort mit 2 EL der Beerenquarkmasse verrühren und dann unter die restliche Beerenquarkmasse rühren. Die Sahne steif schlagen und unter die Beerenquarkmasse heben. Die Masse vorsichtig auf den Tortenboden gießen und die Torte für 4-5 Stunden in den Kühlschrank stellen bis die Masse fest ist.",
      "Für den Heidelbeerspiegel Tortenguss-Fix nach Anleitung mit dem Saft herstellen und auf die feste Quarkmasse geben. Anschließend die Torte wieder in den Kühlschrank stellen bis der Guss fest ist.",
      "Den Tortenrand mit steif geschlagener Sahne bestreichen, oben auf die Torte ein paar Sahnetuffs setzen und mit den restlichen Heidelbeeren dekorieren."
    ],
    "imageUrl": "recipes/96c6d4e4-f82a-4ae5-b648-a6fe1ebc71eb.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 4591,
    "cookedWeight": 4132,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 344,
    "calories100g": 168,
    "protein100g": 5.7,
    "carbs100g": 20.7,
    "fat100g": 6.7,
    "fiber100g": 1,
    "sugar100g": 11.6,
    "createdAt": 1791626514022
  },
  {
    "name": "Gebackene Auberginen",
    "category": "meal",
    "ingredients": [
      {
        "name": "4 Aubergine(n) (á 250 g)",
        "amountGrams": 400,
        "calories": 100,
        "protein": 4,
        "carbs": 24,
        "fat": 0.8,
        "fiber": 12,
        "sugar": 14
      },
      {
        "name": "500 g Tomate(n)",
        "amountGrams": 500,
        "calories": 750,
        "protein": 20,
        "carbs": 100,
        "fat": 25,
        "fiber": 5,
        "sugar": 15
      },
      {
        "name": "2 Kugel/n Mozzarella (á 150 g)",
        "amountGrams": 200,
        "calories": 300,
        "protein": 8,
        "carbs": 40,
        "fat": 10,
        "fiber": 2,
        "sugar": 6
      },
      {
        "name": "2 Zehe/n Knoblauch",
        "amountGrams": 6,
        "calories": 9,
        "protein": 0.4,
        "carbs": 2,
        "fat": 0,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "1 Bund Petersilie",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "Fett für die Form",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "Salz und Pfeffer, frisch gemahlen",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "2 EL Olivenöl",
        "amountGrams": 30,
        "calories": 265,
        "protein": 0,
        "carbs": 0,
        "fat": 30,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Basilikum, einige Blättchen",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Gewaschene Auberginen als Fächer aufschneiden, sodass sie an den Stielenden noch zusammen hängen. Mit Salz bestreuen und 30 Minuten stehen lassen.",
      "Tomaten überbrühen und Haut abziehen. Blütenansätze raus schneiden. Tomaten und Mozzarella in Scheiben schneiden. Abgezogenen Knoblauch fein würfeln und mit gehackter Petersilie mischen.",
      "Auberginen gut abspülen und trocken tupfen. In eine gefettete feuerfeste Form legen. Tomaten, Mozzarella und Petersilienmischung in die Einschnitte stecken. Mit Salz und Pfeffer würzen. Mit dem Öl beträufeln. Im heißen Backofen und bei 225 Grad etwa 50 Minuten backen.",
      "Mit Basilikumblättchen bestreut servieren."
    ],
    "imageUrl": "recipes/a8f6ce5f-719e-4d45-9097-bbf6e1578de2.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 1536,
    "cookedWeight": 1536,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 384,
    "calories100g": 122,
    "protein100g": 2.9,
    "carbs100g": 14.7,
    "fat100g": 5.3,
    "fiber100g": 1.4,
    "sugar100g": 2.9,
    "createdAt": 1791626514022
  },
  {
    "name": "Hildes Zwetschgenkuchen Mit Zimtstreuseln",
    "category": "bread",
    "ingredients": [
      {
        "name": "150 g Mehl",
        "amountGrams": 150,
        "calories": 515,
        "protein": 15.5,
        "carbs": 106.5,
        "fat": 1.5,
        "fiber": 4.8,
        "sugar": 1
      },
      {
        "name": "1 Pck. Puddingpulver (Sahnepudding)",
        "amountGrams": 250,
        "calories": 875,
        "protein": 1.3,
        "carbs": 215,
        "fat": 0.3,
        "fiber": 1.3,
        "sugar": 0
      },
      {
        "name": "120 g Butter",
        "amountGrams": 120,
        "calories": 860,
        "protein": 0.8,
        "carbs": 0.8,
        "fat": 97.3,
        "fiber": 0,
        "sugar": 0.8
      },
      {
        "name": "60 g Zucker",
        "amountGrams": 60,
        "calories": 232,
        "protein": 0,
        "carbs": 60,
        "fat": 0,
        "fiber": 0,
        "sugar": 60
      },
      {
        "name": "1 Ei(er)",
        "amountGrams": 55,
        "calories": 79,
        "protein": 6.9,
        "carbs": 0.4,
        "fat": 5.2,
        "fiber": 0,
        "sugar": 0.4
      },
      {
        "name": "1 Msp. Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Schuss Rum",
        "amountGrams": 100,
        "calories": 240,
        "protein": 0,
        "carbs": 10,
        "fat": 0,
        "fiber": 0,
        "sugar": 10
      },
      {
        "name": "½ kg Pflaume(n) (Zwetschgen)",
        "amountGrams": 100,
        "calories": 46,
        "protein": 0.7,
        "carbs": 11.4,
        "fat": 0.3,
        "fiber": 1.4,
        "sugar": 9.9
      },
      {
        "name": "100 g Mehl",
        "amountGrams": 100,
        "calories": 343,
        "protein": 10.3,
        "carbs": 71,
        "fat": 1,
        "fiber": 3.2,
        "sugar": 0.7
      },
      {
        "name": "75 g Butter",
        "amountGrams": 75,
        "calories": 538,
        "protein": 0.5,
        "carbs": 0.5,
        "fat": 60.8,
        "fiber": 0,
        "sugar": 0.5
      },
      {
        "name": "50 g Zucker",
        "amountGrams": 50,
        "calories": 194,
        "protein": 0,
        "carbs": 50,
        "fat": 0,
        "fiber": 0,
        "sugar": 50
      },
      {
        "name": "2 Pck. Vanillinzucker",
        "amountGrams": 16,
        "calories": 62,
        "protein": 0,
        "carbs": 15.7,
        "fat": 0,
        "fiber": 0,
        "sugar": 15.7
      },
      {
        "name": "1 TL Zimt",
        "amountGrams": 5,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      }
    ],
    "instructions": [
      "Alle Zutaten vom Mehl bis zum Rum zu einen glatten Teig kneten. In eine Springform geben und einen Rand hochziehen.",
      "Mit den entkernten, halbierten Zwetschgen belegen.",
      "Aus den Zutaten vom Mehl bis zum Zimt, Streusel kneten und diese auf dem Kuchen verteilen.",
      "Bei 180 °C 35 - 40 Minuten backen."
    ],
    "imageUrl": "recipes/8c280765-4ce0-4ee3-a546-c785dda9fce9.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1181,
    "cookedWeight": 1063,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 89,
    "calories100g": 384,
    "protein100g": 3.9,
    "carbs100g": 52.8,
    "fat100g": 15.7,
    "fiber100g": 1,
    "sugar100g": 14,
    "createdAt": 1791626514022
  },
  {
    "name": "Himbeertorte Mit Joghurtcreme",
    "category": "bread",
    "ingredients": [
      {
        "name": "4 m.-große Ei(er), getrennt",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "4 EL Wasser, heißes",
        "amountGrams": 60,
        "calories": 3,
        "protein": 0.1,
        "carbs": 0.3,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "125 g Zucker",
        "amountGrams": 125,
        "calories": 484,
        "protein": 0,
        "carbs": 125,
        "fat": 0,
        "fiber": 0,
        "sugar": 125
      },
      {
        "name": "1 Pck. Vanillinzucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "125 g Mehl",
        "amountGrams": 125,
        "calories": 429,
        "protein": 12.9,
        "carbs": 88.8,
        "fat": 1.3,
        "fiber": 4,
        "sugar": 0.9
      },
      {
        "name": "1/2 Pck. Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "11 Blatt Gelatine",
        "amountGrams": 1100,
        "calories": 1650,
        "protein": 44,
        "carbs": 220,
        "fat": 55,
        "fiber": 11,
        "sugar": 33
      },
      {
        "name": "500 g Himbeeren, frisch oder TK, aufgetaut",
        "amountGrams": 500,
        "calories": 260,
        "protein": 6,
        "carbs": 60,
        "fat": 3.5,
        "fiber": 32.5,
        "sugar": 22
      },
      {
        "name": "200 g Frischkäse",
        "amountGrams": 200,
        "calories": 510,
        "protein": 12,
        "carbs": 7,
        "fat": 48,
        "fiber": 0,
        "sugar": 7
      },
      {
        "name": "500 g Naturjoghurt",
        "amountGrams": 500,
        "calories": 300,
        "protein": 20,
        "carbs": 25,
        "fat": 17.5,
        "fiber": 0,
        "sugar": 25
      },
      {
        "name": "400 ml Sahne",
        "amountGrams": 400,
        "calories": 1168,
        "protein": 9.6,
        "carbs": 12.8,
        "fat": 120,
        "fiber": 0,
        "sugar": 12.8
      },
      {
        "name": "60 g Zucker",
        "amountGrams": 60,
        "calories": 232,
        "protein": 0,
        "carbs": 60,
        "fat": 0,
        "fiber": 0,
        "sugar": 60
      },
      {
        "name": "Fett für die Form",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Die Eiweiße mit dem Wasser steif schlagen, 125 g Zucker mit dem Vanillinzucker langsam einrieseln lassen. Die Eigelbe nach und nach unterrühren. Das Mehl mit Backpulver mischen, sieben und vorsichtig unterheben.",
      "Den Teig in eine gefettete und mit Backpapier ausgelegte Springform geben. Bei 175°C 30 min. backen. Nach dem Backen aus der Form lösen und auf einem Kuchengitter erkalten lassen.",
      "Die Gelatine einweichen. Von den Himbeeren einige zum Verzieren raussuchen, den Rest pürieren und durch ein feines Sieb streichen, sodass keine Kerne mehr im Fruchtpüree sind.",
      "Den Frischkäse mit dem Joghurt und 60 g Zucker verrühren. 5 Blatt Gelatine auflösen (es ein paar Sekunden in die Mikrowelle geben, bis es flüssig ist). Ein paar Löffel der Creme zuerst in die Gelatine rühren, anschließend das Ganze zügig unter die Creme rühren. Die restlichen 6 Blatt Gelatine genauso unter das Himbeerpüree rühren. Beides kühlen. 200 ml Sahne steif schlagen, unter die halbfeste Joghurtcreme heben.",
      "Den Boden einmal durchschneiden. Um einen Boden einen Tortenring stellen. Die Hälfte der Joghurtcreme und die Hälfte des Himbeerpürees drauf verteilen und mit einer Gabel leicht marmorieren.",
      "Den zweiten Boden auflegen, den Rest Joghurtcreme und Fruchtpüree drauf verteilen und ebenfalls marmorieren. Die Torte 4 Std. oder besser über Nacht kaltstellen.",
      "Den Tortenring entfernen. 200 ml Sahne steif schlagen, einige Löffel für Sahnetuffs aufheben. Den Rest an den Tortenrand streichen. Nach Belieben mit Sahnetuffs und Himbeeren verzieren."
    ],
    "imageUrl": "recipes/67209f37-e799-43ab-9ed6-0c37f405004a.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 3498,
    "cookedWeight": 3148,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 262,
    "calories100g": 179,
    "protein100g": 4.5,
    "carbs100g": 20.6,
    "fat100g": 8.6,
    "fiber100g": 1.5,
    "sugar100g": 9.5,
    "createdAt": 1791626514022
  },
  {
    "name": "Indische Linsensuppe (Dal)",
    "category": "meal",
    "ingredients": [
      {
        "name": "Zutaten",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "4 EL Olivenöl",
        "amountGrams": 60,
        "calories": 530,
        "protein": 0,
        "carbs": 0,
        "fat": 60,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 Knoblauchzehen, klein gehackt",
        "amountGrams": 6,
        "calories": 9,
        "protein": 0.4,
        "carbs": 2,
        "fat": 0,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "1 Zwiebel, klein gehackt",
        "amountGrams": 80,
        "calories": 32,
        "protein": 0.9,
        "carbs": 7.4,
        "fat": 0.1,
        "fiber": 1.4,
        "sugar": 3.4
      },
      {
        "name": "2 mittelgroße Möhre, geschält und in Scheiben geschnitten",
        "amountGrams": 110,
        "calories": 165,
        "protein": 4.4,
        "carbs": 22,
        "fat": 5.5,
        "fiber": 1.1,
        "sugar": 3.3
      },
      {
        "name": "1 TL Kurkuma (Gelbwurz)",
        "amountGrams": 5,
        "calories": 8,
        "protein": 0.2,
        "carbs": 1,
        "fat": 0.3,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1 TL Garam Masala (Gewürzmischung)",
        "amountGrams": 5,
        "calories": 8,
        "protein": 0.2,
        "carbs": 1,
        "fat": 0.3,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1/4 TL Chilipulver (weniger für Esther)",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "1 TL Kreuzkümmel (Cumin)",
        "amountGrams": 5,
        "calories": 8,
        "protein": 0.2,
        "carbs": 1,
        "fat": 0.3,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1 kl. Dose Pizza Tomaten (400g)",
        "amountGrams": 100,
        "calories": 20,
        "protein": 1,
        "carbs": 4,
        "fat": 0.2,
        "fiber": 1.2,
        "sugar": 2.6
      },
      {
        "name": "250 g rote Linsen",
        "amountGrams": 250,
        "calories": 290,
        "protein": 22.5,
        "carbs": 50,
        "fat": 1,
        "fiber": 19.8,
        "sugar": 4.5
      },
      {
        "name": "800 ml Gemüsebrühe",
        "amountGrams": 800,
        "calories": 40,
        "protein": 1.6,
        "carbs": 4,
        "fat": 0.8,
        "fiber": 0.8,
        "sugar": 1.6
      },
      {
        "name": "Salz und Pfeffer",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1 EL Zitronensaft",
        "amountGrams": 15,
        "calories": 4,
        "protein": 0.2,
        "carbs": 1.4,
        "fat": 0,
        "fiber": 0.4,
        "sugar": 0.4
      }
    ],
    "instructions": [
      "Das Öl in einem Topf erhitzen",
      "Zwiebel, Knobi und Möhre im Fett auslassen, bis sie glasig bzw angebraten sind.",
      "Tomaten und Gemüsebrühe dazugeben.",
      "Linsen (Evtl. + 120 g Reis) hinzugeben",
      "Gewürze dazugeben (Kurkuma, Garam Masala, Kreuzkümmel, Chilipulver individuell), gut verrühren und bei geschlossenem Deckel und kleiner Hitze ca.20 Minuten garen.",
      "evtl etwas Gemüsebrühe nachgießen.",
      "mit Salz, Pfeffer und Zironensaft abschmecken."
    ],
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 1736,
    "cookedWeight": 1736,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 434,
    "calories100g": 82,
    "protein100g": 2.3,
    "carbs100g": 7.7,
    "fat100g": 4.5,
    "fiber100g": 1.6,
    "sugar100g": 1.3,
    "createdAt": 1791626514022
  },
  {
    "name": "Johannisbeer - Käsekuchen Mit Streusel",
    "category": "bread",
    "ingredients": [
      {
        "name": "300 g Mehl",
        "amountGrams": 300,
        "calories": 1029,
        "protein": 30.9,
        "carbs": 213,
        "fat": 3,
        "fiber": 9.6,
        "sugar": 2.1
      },
      {
        "name": "1 ½ TL Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "80 g Mandel(n), gemahlen",
        "amountGrams": 80,
        "calories": 120,
        "protein": 3.2,
        "carbs": 16,
        "fat": 4,
        "fiber": 0.8,
        "sugar": 2.4
      },
      {
        "name": "200 g Butter",
        "amountGrams": 200,
        "calories": 1434,
        "protein": 1.4,
        "carbs": 1.4,
        "fat": 162.2,
        "fiber": 0,
        "sugar": 1.4
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "2 EL Amaretto",
        "amountGrams": 30,
        "calories": 72,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 3
      },
      {
        "name": "100 g Marzipan, gerieben",
        "amountGrams": 100,
        "calories": 450,
        "protein": 8,
        "carbs": 52,
        "fat": 23,
        "fiber": 5,
        "sugar": 50
      },
      {
        "name": "500 g Quark, Magerquark",
        "amountGrams": 500,
        "calories": 335,
        "protein": 60,
        "carbs": 20,
        "fat": 1,
        "fiber": 0,
        "sugar": 20
      },
      {
        "name": "1 Pck. Puddingpulver, Vanillegeschmack",
        "amountGrams": 8,
        "calories": 28,
        "protein": 0,
        "carbs": 6.9,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 Ei(er)",
        "amountGrams": 110,
        "calories": 157,
        "protein": 13.9,
        "carbs": 0.8,
        "fat": 10.5,
        "fiber": 0,
        "sugar": 0.8
      },
      {
        "name": "120 g Puderzucker",
        "amountGrams": 120,
        "calories": 467,
        "protein": 0,
        "carbs": 120,
        "fat": 0,
        "fiber": 0,
        "sugar": 120
      },
      {
        "name": "½ Zitrone(n), abgeriebene Schale davon, unbehandelt",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      },
      {
        "name": "3 EL Likör, (Johannisbeerlikör)",
        "amountGrams": 45,
        "calories": 108,
        "protein": 0,
        "carbs": 4.5,
        "fat": 0,
        "fiber": 0,
        "sugar": 4.5
      },
      {
        "name": "200 ml Schlagsahne, gut gekühlt",
        "amountGrams": 200,
        "calories": 584,
        "protein": 4.8,
        "carbs": 6.4,
        "fat": 60,
        "fiber": 0,
        "sugar": 6.4
      },
      {
        "name": "300 g Johannisbeeren, rote",
        "amountGrams": 300,
        "calories": 168,
        "protein": 4.2,
        "carbs": 41.4,
        "fat": 0.6,
        "fiber": 12.9,
        "sugar": 22.2
      },
      {
        "name": "etwas Puderzucker, zum Bestreuen",
        "amountGrams": 100,
        "calories": 389,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0,
        "sugar": 100
      }
    ],
    "instructions": [
      "Für den Streuselteig Mehl und Backpulver mischen und in eine Schüssel sieben.",
      "Zucker, Mandeln, Butterflocken, eine Prise Salz, Vanillezucker und Amaretto dazu geben und mit den Händen zu einem krümeligen Teig ( Streuseln ) verarbeiten.",
      "Die Hälfte der Streusel auf den Boden einer gefetteten und mit Mehl bestäubten Springform, 26cm Durchmesser, geben und mit den Fingern gleichmäßig in die Form drücken, dabei einen Rand von etwa 1 cm hochdrücken und kalt stellen.",
      "Die übrigen Streusel ebenfalls kalt stellen.",
      "In der Zwischenzeit die Füllung zubereiten.",
      "Hierzu die Johannisbeeren waschen und entstielen. Den Quark mit dem Puderzucker, Puddingpulver, Johannisbeerlikör, den Eiern und der abgeriebenen Zitronenschale gut verrühren. Die gut gekühlte Schlagsahne fast steif schlagen und unter die Quarkmasse rühren.",
      "Die Quarkmasse in die Form auf den Streuselboden füllen, glatt streichen und die Johannisbeeren gleichmäßig darüber verteilen.",
      "Marzipan grob raspeln und mit den restlichen Streuseln verrühren, alles schön zerkrümeln und vollkommen deckend über die Johannisbeeren streuen.",
      "Den Kuchen im vorgeheizten Backofen auf mittlerer Schiene bei 180 Grad Ober-/Unterhitze für 50 bis 55 Minuten backen, bis die Streusel schön goldbraun sind. Sollten die Streusel zu rasch bräunen, können diese mit Alufolie abgedeckt werden. Den Kuchen nach dem Backen noch 15 Minuten im ausgeschalteten, geschlossenen Backofen lassen. Wichtig! Dann herausnehmen, den Teigrand von der Form lösen, auskühlen lassen und in der Springform über Nacht in den Kühlschrank stellen. Erst dann den Tortenring entfernen und den Kuchen mithilfe eines Tortenhebers auf die Tortenplatte setzen. Mit Puderzucker bestreuen.",
      "Am zweiten Tag, nachdem er gut durchgezogen ist, schmeckt der Kuchen noch besser."
    ],
    "imageUrl": "recipes/37bfec56-b70e-4be6-b09f-9670e94bb98c.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2551,
    "cookedWeight": 2296,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 191,
    "calories100g": 265,
    "protein100g": 5.8,
    "carbs100g": 33.7,
    "fat100g": 11.5,
    "fiber100g": 1.4,
    "sugar100g": 21.5,
    "createdAt": 1791626514023
  },
  {
    "name": "Kirschstreusel",
    "category": "bread",
    "ingredients": [
      {
        "name": "250 g Mehl",
        "amountGrams": 250,
        "calories": 858,
        "protein": 25.8,
        "carbs": 177.5,
        "fat": 2.5,
        "fiber": 8,
        "sugar": 1.8
      },
      {
        "name": "125 g Butter oder Margarine",
        "amountGrams": 125,
        "calories": 896,
        "protein": 0.9,
        "carbs": 0.9,
        "fat": 101.4,
        "fiber": 0,
        "sugar": 0.9
      },
      {
        "name": "1 Ei(er)",
        "amountGrams": 55,
        "calories": 79,
        "protein": 6.9,
        "carbs": 0.4,
        "fat": 5.2,
        "fiber": 0,
        "sugar": 0.4
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "50 g Zucker",
        "amountGrams": 50,
        "calories": 194,
        "protein": 0,
        "carbs": 50,
        "fat": 0,
        "fiber": 0,
        "sugar": 50
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "2 Gläser Schattenmorellen",
        "amountGrams": 400,
        "calories": 252,
        "protein": 4,
        "carbs": 64,
        "fat": 0.8,
        "fiber": 6.4,
        "sugar": 51.2
      },
      {
        "name": "1 Pck. Puddingpulver (Schokolade)",
        "amountGrams": 250,
        "calories": 875,
        "protein": 1.3,
        "carbs": 215,
        "fat": 0.3,
        "fiber": 1.3,
        "sugar": 0
      },
      {
        "name": "175 g Mehl",
        "amountGrams": 175,
        "calories": 600,
        "protein": 18,
        "carbs": 124.3,
        "fat": 1.8,
        "fiber": 5.6,
        "sugar": 1.2
      },
      {
        "name": "75 g Zucker",
        "amountGrams": 75,
        "calories": 290,
        "protein": 0,
        "carbs": 75,
        "fat": 0,
        "fiber": 0,
        "sugar": 75
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "100 g Margarine oder Butter",
        "amountGrams": 100,
        "calories": 717,
        "protein": 0.7,
        "carbs": 0.7,
        "fat": 81.1,
        "fiber": 0,
        "sugar": 0.7
      },
      {
        "name": "½ Pck. Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Fett für die Form",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Backofen auf 180°C vorheizen.",
      "Aus 250 g Mehl, 125 g Butter, 1 Ei, 1 Prise Salz, 50 g Zucker und 1 Pck. Vanillezucker einen Teig herstellen.",
      "Tipp: die Butter sollte etwas kalt sein und in kleine Würfelchen geschnitten werden. Das Mehl vorher sieben.",
      "Eine Springform einfetten und den Teig in die Form drücken. Mit einer Gabel mehrfach einstechen. Die Kirschen abschütten und den Saft dabei auffangen. Dann die Kirschen auf den Teig streuen, sobald sie gut abgetropft sind. Mit 400 ml von dem aufgefangenen Kirschsaft den Pudding nach Packungsanweisung zubereiten (dabei aber keinen Zucker hinzufügen!). Den Pudding auf die Kirschen geben und verteilen.",
      "100 g Margarine oder Butter schmelzen. In einer Schüssel nun 175 g Mehl, 75 g Zucker, 1 Prise Salz, 1 Pck. Backpulver und 1 Pck. Vanillezucker vermischen. Die flüssige Butter nun hinzufügen und alles vermischen (das ergibt eine richtig fiese Pampe, aber auch gleichzeitig die knusprigsten Streusel und durch das Backpulver werden diese auch noch schön groß). Die Streusel mit der Hand auf den Kuchen bröseln.",
      "Bei 180°C Ober-/Unterhitze auf mittlerer Schiene ca. 50-60 Minuten backen (bei der Backzeit kommt auch etwas auf den Ofen an).",
      "Tipp: Sollte die Backzeit noch nicht zu Ende sein, die Streusel aber bereits goldgelb, den Kuchen mit Zeitungspapier (aber nur eine Tageszeitung - wenn möglich ohne Bilder. KEINE Zeitschriften verwenden!) abdecken. Das riecht dann zwar etwas beim Backen, schadet dem Kuchen aber weder geruchlich noch geschmacklich, der Kuchen ist aber gegen Verbrennen geschützt.",
      "Anmerkung: Sollte man Schattenmorellen aus Eigenanbau verwenden sollte man die zusätzliche Zuckerfrage vielleicht noch einmal überdenken. Ich spreche hier nur von gekauften Kirschen."
    ],
    "imageUrl": "recipes/aa881d1e-5d8d-4e91-af78-4fdca0be0f28.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1896,
    "cookedWeight": 1706,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 142,
    "calories100g": 298,
    "protein100g": 3.9,
    "carbs100g": 44.8,
    "fat100g": 11.6,
    "fiber100g": 1.3,
    "sugar100g": 11.7,
    "createdAt": 1791626514023
  },
  {
    "name": "Mokkatorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "500 g Mehl",
        "amountGrams": 500,
        "calories": 1715,
        "protein": 51.5,
        "carbs": 355,
        "fat": 5,
        "fiber": 16,
        "sugar": 3.5
      },
      {
        "name": "250 g Butter",
        "amountGrams": 250,
        "calories": 1793,
        "protein": 1.8,
        "carbs": 1.8,
        "fat": 202.8,
        "fiber": 0,
        "sugar": 1.8
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "2 Pkt. Vanillezucker",
        "amountGrams": 200,
        "calories": 780,
        "protein": 0,
        "carbs": 196,
        "fat": 0,
        "fiber": 0,
        "sugar": 196
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "2 Ei(er)",
        "amountGrams": 110,
        "calories": 157,
        "protein": 13.9,
        "carbs": 0.8,
        "fat": 10.5,
        "fiber": 0,
        "sugar": 0.8
      },
      {
        "name": "150 ml Kaffee",
        "amountGrams": 150,
        "calories": 3,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 1/2 Liter Milch",
        "amountGrams": 100,
        "calories": 64,
        "protein": 3.3,
        "carbs": 4.8,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 4.8
      },
      {
        "name": "3 1/2 Pkt. Puddingpulver, Karamell",
        "amountGrams": 300,
        "calories": 1050,
        "protein": 1.5,
        "carbs": 258,
        "fat": 0.3,
        "fiber": 1.5,
        "sugar": 0
      },
      {
        "name": "1 1/2 EL Espresso - Pulver, Instant",
        "amountGrams": 100,
        "calories": 2,
        "protein": 0.1,
        "carbs": 0.3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "10 EL Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "600 g Butter",
        "amountGrams": 600,
        "calories": 4302,
        "protein": 4.2,
        "carbs": 4.2,
        "fat": 486.6,
        "fiber": 0,
        "sugar": 4.2
      },
      {
        "name": "100 g Schokolade, bitter, gehackte",
        "amountGrams": 100,
        "calories": 535,
        "protein": 7.5,
        "carbs": 58,
        "fat": 30,
        "fiber": 2,
        "sugar": 57
      },
      {
        "name": "Kaffee",
        "amountGrams": 100,
        "calories": 2,
        "protein": 0.1,
        "carbs": 0.3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      }
    ],
    "instructions": [
      "Teigzubereitung:",
      "Das Mehl in eine Schüssel sieben und mit Zucker, Vanillezucker und Salz kurz vermischen.",
      "Ei und Butter hinzufügen und alles gute 5 Minuten kräftig durchkneten.",
      "Den Teig zu einer Kugel formen und abgedeckt mind. 30 Minuten kühl stellen.",
      "Nach dem Ruhen den Teig in 5 oder 6 Teile portionieren (je nach Bedarf) ausrollen und einzelne Böden bei 180 Grad ca. 20 Minuten goldgelb backen. Auskühlen lassen.",
      "Cremezubereitung:",
      "1 Liter Milch mit 1 EL Espressopulver darin aufkochen.",
      "Die restlichen 500 ml Milch mit dem Puddingpulver und Zucker verrühren und in die heiße Espressomilch geben. Kurz aufkochen, abkühlen lassen und alle 5 bis 10 Minuten umrühren, damit sich keine Haut bildet.",
      "Wenn der Pudding abgekühlt ist, die zimmerwarme Butter schaumig schlagen und dann esslöffelweise den Pudding unterrühren. Vor der Weiterverarbeitung die Masse ca. 15 Minuten kalt stellen. Schokolade hacken und untermengen.",
      "Bevor die Creme auf die einzelnen Böden geschichtet wird, diese mit Kaffee tränken.",
      "4 EL Creme beiseite stellen zum Einstreichen.",
      "Böden übereinander setzen und mit Espressopulver bestäuben oder mit Nüssen verzieren.",
      "Am besten einen Tag ziehen lassen."
    ],
    "imageUrl": "recipes/29a85ff8-a4ef-4b71-bbc6-138e3c5ed0b4.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2910,
    "cookedWeight": 2619,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 218,
    "calories100g": 442,
    "protein100g": 3.2,
    "carbs100g": 45.1,
    "fat100g": 28.2,
    "fiber100g": 0.7,
    "sugar100g": 21.7,
    "createdAt": 1791626514023
  },
  {
    "name": "Mozart-Torte",
    "category": "bread",
    "ingredients": [
      {
        "name": "4 Ei(er), getrennt",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "4 EL Wasser, heißes",
        "amountGrams": 60,
        "calories": 3,
        "protein": 0.1,
        "carbs": 0.3,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "125 g Zucker",
        "amountGrams": 125,
        "calories": 484,
        "protein": 0,
        "carbs": 125,
        "fat": 0,
        "fiber": 0,
        "sugar": 125
      },
      {
        "name": "75 g Mehl",
        "amountGrams": 75,
        "calories": 257,
        "protein": 7.7,
        "carbs": 53.3,
        "fat": 0.8,
        "fiber": 2.4,
        "sugar": 0.5
      },
      {
        "name": "75 g Speisestärke",
        "amountGrams": 75,
        "calories": 263,
        "protein": 0.4,
        "carbs": 64.5,
        "fat": 0.1,
        "fiber": 0.4,
        "sugar": 0
      },
      {
        "name": "2 EL Kakaopulver",
        "amountGrams": 30,
        "calories": 96,
        "protein": 6,
        "carbs": 4.2,
        "fat": 4.2,
        "fiber": 9,
        "sugar": 0.3
      },
      {
        "name": "2 TL Backpulver",
        "amountGrams": 10,
        "calories": 10,
        "protein": 0.5,
        "carbs": 2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "900 g Schlagsahne",
        "amountGrams": 900,
        "calories": 2628,
        "protein": 21.6,
        "carbs": 28.8,
        "fat": 270,
        "fiber": 0,
        "sugar": 28.8
      },
      {
        "name": "100 g Schokolade, Vollmilch",
        "amountGrams": 100,
        "calories": 64,
        "protein": 3.3,
        "carbs": 4.8,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 4.8
      },
      {
        "name": "100 g Schokolade, edelbitter",
        "amountGrams": 100,
        "calories": 535,
        "protein": 7.5,
        "carbs": 58,
        "fat": 30,
        "fiber": 2,
        "sugar": 57
      },
      {
        "name": "100 g Nougat",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "100 g Pistazien, fein gemahlen",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "1 Marzipan - Decke",
        "amountGrams": 100,
        "calories": 450,
        "protein": 8,
        "carbs": 52,
        "fat": 23,
        "fiber": 5,
        "sugar": 50
      },
      {
        "name": "7 Pck. Sahnesteif",
        "amountGrams": 56,
        "calories": 164,
        "protein": 1.3,
        "carbs": 1.8,
        "fat": 16.8,
        "fiber": 0,
        "sugar": 1.8
      },
      {
        "name": "1 EL Pistazien, gehackt",
        "amountGrams": 15,
        "calories": 23,
        "protein": 0.6,
        "carbs": 3,
        "fat": 0.8,
        "fiber": 0.2,
        "sugar": 0.5
      },
      {
        "name": "4 Pralinen (Mozartkugeln)",
        "amountGrams": 400,
        "calories": 600,
        "protein": 16,
        "carbs": 80,
        "fat": 20,
        "fiber": 4,
        "sugar": 12
      },
      {
        "name": "1 EL Schokoladenraspel",
        "amountGrams": 15,
        "calories": 80,
        "protein": 1.1,
        "carbs": 8.7,
        "fat": 4.5,
        "fiber": 0.3,
        "sugar": 8.5
      }
    ],
    "instructions": [
      "Am Vortag die Schokolade und 400 g Sahne in einen Topf geben und darin schmelzen lassen. Die Sahne darf dabei nicht kochen. Über Nacht - mindestens aber 5 Stunden - im Kühlschrank auskühlen lassen. Die Nugatsahne aus 200 g Schlagsahne und dem Nugat ebenso vorbereiten.",
      "Für den Biskuit die Eiweiße mit 1 Prise Salz steif schlagen. Die Eigelbe mit heißem Wasser und Zucker cremig aufschlagen (ca. 6 - 8 Minuten, das Volumen muss sich fast verdoppelt haben und die Masse muss cremig und weißlich gelb sein). Den Eischnee auf die Eigelbcreme geben. Stärke, Mehl, Backpulver, Kakaopulver auf die Eiermasse sieben und unterheben.",
      "Den Teig in eine mit Backpapier ausgelegte Springform (26 cm) füllen. Im vorgeheizten Backofen bei 200 °C ca. 35 Minuten backen (evtl. nach der Hälfte der Zeit abdecken). Im abgeschalteten Ofen ca. 10 Minuten ruhen lassen. Danach aus dem Ofen nehmen und aus der Form lösen. Das Backpapier abziehen und Boden vollständig auskühlen lassen. Den Boden waagerecht in drei Teile teilen.",
      "Die Schokoladensahne aus dem Kühlschrank nehmen und mit 3 Pck. Sahnesteif steif schlagen. Die Hälfte der Schokosahne auf den untersten Tortenboden streichen und den zweiten Boden darauf legen. Die restliche Schokosahne im Kühlschrank aufbewahren.",
      "Die Nugatsahne aus dem Kühlschrank nehmen mit 1 1/2 Pck. Sahnesteif steif schlagen und auf den zweiten Boden streichen. Die Marzipandecke auf Tortengröße zuschneiden, am besten unter Zuhilfenahme des Springformrandes und danach auf die Nugatsahne legen.",
      "Für die Pistaziensahne 100 g Pistazien fein mahlen. 200 g Sahne mit 1 1/2 Pck. Sahnesteif steif schlagen und die gemahlenen Pistazien unterheben. Die Pistaziensahne auf die Marzipandecke streichen und mit dem dritten Tortenboden abdecken.",
      "Die Torte mit der restlichen Schokosahne bestreichen (auch den Rand). 100 g Sahne mit 1 Pck. Sahnesteif steif schlagen, in einen Spritzbeutel füllen und die Torte mit 16 Sahnetupfen dekorieren. Die gehackten Pistazien auf die Sahnetupfen streuen. Die Mozartkugeln vorsichtig vierteln und auf jeden Sahnetupfen ein Pralinenviertel setzen. Die Raspelschokolade auf die Tortenmitte streuen."
    ],
    "imageUrl": "recipes/2e67801d-2691-441b-ad2f-5518ae5fcbe2.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2481,
    "cookedWeight": 2233,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 186,
    "calories100g": 281,
    "protein100g": 4.9,
    "carbs100g": 23.6,
    "fat100g": 18.1,
    "fiber100g": 1.1,
    "sugar100g": 13.3,
    "createdAt": 1791626514024
  },
  {
    "name": "Nudeln Mit Räucherlachs Und Blattspinat",
    "category": "meal",
    "ingredients": [
      {
        "name": "250 g Nudeln",
        "amountGrams": 250,
        "calories": 900,
        "protein": 32.5,
        "carbs": 177.5,
        "fat": 3.8,
        "fiber": 8.8,
        "sugar": 6.3
      },
      {
        "name": "1 Zwiebel(n), klein geschnittene",
        "amountGrams": 80,
        "calories": 32,
        "protein": 0.9,
        "carbs": 7.4,
        "fat": 0.1,
        "fiber": 1.4,
        "sugar": 3.4
      },
      {
        "name": "2 Knoblauchzehe(n), klein geschnittener",
        "amountGrams": 6,
        "calories": 9,
        "protein": 0.4,
        "carbs": 2,
        "fat": 0,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "100 ml Sahne oder Milch",
        "amountGrams": 100,
        "calories": 64,
        "protein": 3.3,
        "carbs": 4.8,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 4.8
      },
      {
        "name": "200 g Blattspinat (TK oder frischer, bereits blanchiert)",
        "amountGrams": 200,
        "calories": 46,
        "protein": 5.8,
        "carbs": 7.2,
        "fat": 0.8,
        "fiber": 4.4,
        "sugar": 0.8
      },
      {
        "name": "150 g Lachs, geräucherter",
        "amountGrams": 150,
        "calories": 255,
        "protein": 30,
        "carbs": 0,
        "fat": 15,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 EL Öl",
        "amountGrams": 30,
        "calories": 265,
        "protein": 0,
        "carbs": 0,
        "fat": 30,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Pfeffer",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "Muskat",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      }
    ],
    "instructions": [
      "Die Nudeln nach Packungsanleitung garen. Anschließend durch ein Sieb abgießen.",
      "In der Zwischenzeit das Öl erhitzen und die klein geschnittene Zwiebel sowie den Knoblauch darin andünsten. Sobald es anfängt Farbe zu nehmen, mit der Sahne bzw. der Milch ablöschen. Den Blattspinat putzen, klein schneiden und hinzugeben. Das Ganze gut mit Muskat, Pfeffer und Salz würzen und ca. 8 Minuten köcheln lassen. Sollte die Masse zu fest werden, noch etwas Sahne, Milch oder auch Wasser nachgießen (es sollte jedoch nicht so viel Flüssigkeit im Topf sein, da die Nudeln sonst wässrig werden). Anschließend die gekochten Nudeln mit der Sauce mischen. Zum Schluss wird der Lachs klein geschnitten und untergehoben.",
      "Nicht mehr kochen lassen, sondern sofort servieren. Der Lachs sollte nur leicht erhitzt werden, weil er sonst an Geschmack verliert."
    ],
    "imageUrl": "recipes/0848a1f6-ee27-490d-8964-bca3bff8a19a.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 1116,
    "cookedWeight": 1116,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 279,
    "calories100g": 142,
    "protein100g": 6.6,
    "carbs100g": 18,
    "fat100g": 4.8,
    "fiber100g": 1.3,
    "sugar100g": 1.4,
    "createdAt": 1791626514024
  },
  {
    "name": "Paella De Marisco",
    "category": "meal",
    "ingredients": [
      {
        "name": "500 g Muschel(n)",
        "amountGrams": 500,
        "calories": 750,
        "protein": 20,
        "carbs": 100,
        "fat": 25,
        "fiber": 5,
        "sugar": 15
      },
      {
        "name": "250 g Tintenfisch(e), die Tuben davon",
        "amountGrams": 250,
        "calories": 230,
        "protein": 40,
        "carbs": 7.5,
        "fat": 3.5,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "125 g Garnele(n), roh",
        "amountGrams": 125,
        "calories": 188,
        "protein": 5,
        "carbs": 25,
        "fat": 6.3,
        "fiber": 1.3,
        "sugar": 3.8
      },
      {
        "name": "400 g Fischfilet(s) (z.B. Lengfisch)",
        "amountGrams": 400,
        "calories": 600,
        "protein": 16,
        "carbs": 80,
        "fat": 20,
        "fiber": 4,
        "sugar": 12
      },
      {
        "name": "1 Paprikaschote(n), rote",
        "amountGrams": 100,
        "calories": 31,
        "protein": 1,
        "carbs": 6,
        "fat": 0.3,
        "fiber": 2.1,
        "sugar": 4.2
      },
      {
        "name": "1 Zwiebel(n)",
        "amountGrams": 80,
        "calories": 32,
        "protein": 0.9,
        "carbs": 7.4,
        "fat": 0.1,
        "fiber": 1.4,
        "sugar": 3.4
      },
      {
        "name": "2 Zehe/n Knoblauch",
        "amountGrams": 6,
        "calories": 9,
        "protein": 0.4,
        "carbs": 2,
        "fat": 0,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "4 EL Olivenöl",
        "amountGrams": 60,
        "calories": 530,
        "protein": 0,
        "carbs": 0,
        "fat": 60,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Salz und Pfeffer",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "250 g Reis (z.B. Arborio)",
        "amountGrams": 250,
        "calories": 875,
        "protein": 17.5,
        "carbs": 195,
        "fat": 1.8,
        "fiber": 2.5,
        "sugar": 0.3
      },
      {
        "name": "1 Dose Safranpulver (kleines Döschen)",
        "amountGrams": 400,
        "calories": 600,
        "protein": 16,
        "carbs": 80,
        "fat": 20,
        "fiber": 4,
        "sugar": 12
      },
      {
        "name": "150 g Erbsen (TK)",
        "amountGrams": 150,
        "calories": 225,
        "protein": 6,
        "carbs": 30,
        "fat": 7.5,
        "fiber": 1.5,
        "sugar": 4.5
      },
      {
        "name": "½ Zitrone(n), der Saft davon",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      },
      {
        "name": "1 Liter Wasser",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "1 Paprikaschote(n), gelbe",
        "amountGrams": 100,
        "calories": 31,
        "protein": 1,
        "carbs": 6,
        "fat": 0.3,
        "fiber": 2.1,
        "sugar": 4.2
      }
    ],
    "instructions": [
      "TK-Ware auftauen. Muscheln unter fließend kaltem Wasser waschen. Bei den Miesmuscheln evtl. die schwarzen Bärte mit einem Messer entfernen. Offene Muscheln auf die Arbeitsfläche klopfen. Schließen sie sich nicht, wegwerfen! Tintenfisch-Tuben, Garnelen und Fischfilet waschen und trockentupfen. Tintenfisch in Ringe, Fisch in Stücke schneiden. Paprikaschoten putzen, waschen und klein schneiden. Zwiebel schälen und fein würfeln. Knoblauch schälen und durchpressen.",
      "2 EL Öl in einer großen Pfanne erhitzen. Fisch, Tintenfisch und Garnelen darin unter Wenden bei mittlerer Hitze ca. 2-3 Minuten braten. Mit Salz und Pfeffer würzen. Alles aus der Pfanne nehmen.",
      "2 EL Öl in der Pfanne erhitzen. Paprika- und Zwiebelwürfel darin anbraten. Knoblauch und Reis unterrühren, kurz mitdünsten.",
      "1 l Wasser aufkochen. Safran und 1/2 TL Salz darin auflösen und angießen.",
      "Unter Rühren wieder aufkochen. Muscheln, Fisch und übrige Meeresfrüchte zugeben. Ca. 20 Minuten ohne Rühren köcheln, bis alle Flüssigkeit aufgesogen ist. Erbsen die letzen 5 Minuten mitgaren.",
      "Paella mit einem Geschirrtuch bedecken, 5-8 Minuten ruhen lassen. Geschlossene Muscheln aussortieren.",
      "Die Paella mit Salz, Pfeffer und Zitronensaft kräftig abschmecken und servieren."
    ],
    "imageUrl": "recipes/9a989c1a-0a02-4031-96b9-965012154e36.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 2721,
    "cookedWeight": 2721,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 680,
    "calories100g": 152,
    "protein100g": 4.6,
    "carbs100g": 20.2,
    "fat100g": 5.3,
    "fiber100g": 1,
    "sugar100g": 2.3,
    "createdAt": 1791626514024
  },
  {
    "name": "Pflaumenkuchen Mit Streuseln",
    "category": "bread",
    "ingredients": [
      {
        "name": "550 g Pflaume(n), frische, entsteint, längs halbiert",
        "amountGrams": 550,
        "calories": 825,
        "protein": 22,
        "carbs": 110,
        "fat": 27.5,
        "fiber": 5.5,
        "sugar": 16.5
      },
      {
        "name": "150 g Butter, geschmolzen",
        "amountGrams": 150,
        "calories": 1076,
        "protein": 1,
        "carbs": 1,
        "fat": 121.7,
        "fiber": 0,
        "sugar": 1
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "3 Eigelb",
        "amountGrams": 165,
        "calories": 531,
        "protein": 26.4,
        "carbs": 5.9,
        "fat": 44.6,
        "fiber": 0,
        "sugar": 1
      },
      {
        "name": "1 Pck. Vanillezucker oder etwas Vanillearoma",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "300 g Mehl",
        "amountGrams": 300,
        "calories": 1029,
        "protein": 30.9,
        "carbs": 213,
        "fat": 3,
        "fiber": 9.6,
        "sugar": 2.1
      }
    ],
    "instructions": [
      "Die Butter gemeinsam mit dem Zucker in einem Topf erhitzen bis sie geschmolzen ist, mehrfach gut umrühren und etwas abkühlen lassen.",
      "Eigelb und Mehl in eine Rührschüssel geben; kurz mit dem Mixgerät umrühren. Die Butter-Zuckermasse (und nach Belieben Vanillearoma) hinzugeben und mit dem Mixgerät nur so lange rühren, bis ein krümeliger Teig entstanden ist. 3/4 der Krümel in eine gefettete Springform geben und mit einem Löffel zu einem Teigboden drücken.",
      "Die halbierten Pflaumen dicht nebeneinander (sollten sich nicht überlappen) auf dem Teigboden verteilen und mit den restlichen Streuseln bedecken. Ggfs. vor den Streuseln noch etwas Zucker über die Pflaumen streuen, falls sie etwas säuerlich sind. Bei 180 Grad 45 - 50 Minuten backen. Gegebenenfalls (rechtzeitig!) den Kuchen mit Alufolie abdecken, falls die Streusel zu braun werden."
    ],
    "imageUrl": "recipes/3495fdf4-4110-4066-8ba8-fe668e4d91fe.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1323,
    "cookedWeight": 1191,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 99,
    "calories100g": 342,
    "protein100g": 6.7,
    "carbs100g": 40.9,
    "fat100g": 16.5,
    "fiber100g": 1.3,
    "sugar100g": 15,
    "createdAt": 1791626514024
  },
  {
    "name": "Rabarber - Streuselkucken",
    "category": "bread",
    "ingredients": [
      {
        "name": "1 Glas Öl",
        "amountGrams": 200,
        "calories": 1768,
        "protein": 0,
        "carbs": 0,
        "fat": 200,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Glas Milch",
        "amountGrams": 200,
        "calories": 128,
        "protein": 6.6,
        "carbs": 9.6,
        "fat": 7.2,
        "fiber": 0,
        "sugar": 9.6
      },
      {
        "name": "2 Gläser Zucker",
        "amountGrams": 400,
        "calories": 1548,
        "protein": 0,
        "carbs": 400,
        "fat": 0,
        "fiber": 0,
        "sugar": 400
      },
      {
        "name": "4 Gläser Mehl",
        "amountGrams": 800,
        "calories": 2744,
        "protein": 82.4,
        "carbs": 568,
        "fat": 8,
        "fiber": 25.6,
        "sugar": 5.6
      },
      {
        "name": "4 Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "1 Pck. Backpulver",
        "amountGrams": 15,
        "calories": 15,
        "protein": 0.8,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 Pck. Vanillinzucker",
        "amountGrams": 16,
        "calories": 62,
        "protein": 0,
        "carbs": 15.7,
        "fat": 0,
        "fiber": 0,
        "sugar": 15.7
      },
      {
        "name": "1 kg Rhabarber, geputzt, in Stücke geschnitten",
        "amountGrams": 1000,
        "calories": 210,
        "protein": 9,
        "carbs": 45,
        "fat": 2,
        "fiber": 18,
        "sugar": 11
      },
      {
        "name": "100 g Butter",
        "amountGrams": 100,
        "calories": 717,
        "protein": 0.7,
        "carbs": 0.7,
        "fat": 81.1,
        "fiber": 0,
        "sugar": 0.7
      },
      {
        "name": "200 g Mehl",
        "amountGrams": 200,
        "calories": 686,
        "protein": 20.6,
        "carbs": 142,
        "fat": 2,
        "fiber": 6.4,
        "sugar": 1.4
      },
      {
        "name": "100 g Zucker",
        "amountGrams": 100,
        "calories": 387,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0,
        "sugar": 100
      },
      {
        "name": "1 Pck. Vanillinzucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      }
    ],
    "instructions": [
      "Für den Teig alle Zutaten bis auf den Rhabarber in eine Schüssel geben und mit dem Mixer auf höchster Stufe verrühren, bis der Teig schön glatt ist (ca. 2 Minuten). Dann auf ein hohes Backblech (Fettpfanne) geben und den geschälten und in ca. 2 cm große Stücke geschnittenen Rhabarber darauf verteilen. Die Rhabarberstücke evtl. leicht andrücken.",
      "Für die Streusel die weiche Butter in kleinen Stücken mit dem Mehl, dem Zucker und dem Vanillezucker zu Bröseln verkneten. Am besten geht das mit der Hand. Den Kuchen mit den Streuseln bestreuen. Bei 160°C (Umluft) ca. 45 min. backen.",
      "Der Kuchen ist sehr saftig und saftet in den nächsten Tagen noch nach. Wer ihn also nicht am gleichen Tag aufessen möchte, kann 1/2 Glas Mehl durch Speisestärke ersetzen. Das bindet die Feuchtigkeit des Rhabarbers.",
      "Der Kuchen eignet sich auch für anderes Obst wie z. B. Äpfel. Er sollte dicht belegt sein, da er gut aufgeht."
    ],
    "imageUrl": "recipes/33fa6ddf-f49a-47ab-bb7a-b192420ed702.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 3259,
    "cookedWeight": 2933,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 244,
    "calories100g": 294,
    "protein100g": 5,
    "carbs100g": 44.1,
    "fat100g": 11,
    "fiber100g": 1.7,
    "sugar100g": 18.9,
    "createdAt": 1791626514024
  },
  {
    "name": "Raffaelo - Torte",
    "category": "bread",
    "ingredients": [
      {
        "name": "120 g Zucker",
        "amountGrams": 120,
        "calories": 464,
        "protein": 0,
        "carbs": 120,
        "fat": 0,
        "fiber": 0,
        "sugar": 120
      },
      {
        "name": "1 Vanillezucker",
        "amountGrams": 100,
        "calories": 390,
        "protein": 0,
        "carbs": 98,
        "fat": 0,
        "fiber": 0,
        "sugar": 98
      },
      {
        "name": "150 g Mehl",
        "amountGrams": 150,
        "calories": 515,
        "protein": 15.5,
        "carbs": 106.5,
        "fat": 1.5,
        "fiber": 4.8,
        "sugar": 1
      },
      {
        "name": "1 TL Backpulver",
        "amountGrams": 5,
        "calories": 5,
        "protein": 0.3,
        "carbs": 1,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "4 Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "4 EL Wasser, warm",
        "amountGrams": 60,
        "calories": 3,
        "protein": 0.1,
        "carbs": 0.3,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.1
      },
      {
        "name": "200 g Kokosraspel",
        "amountGrams": 200,
        "calories": 1320,
        "protein": 14,
        "carbs": 15,
        "fat": 130,
        "fiber": 32,
        "sugar": 14
      },
      {
        "name": "200 g Schokolade, weiß",
        "amountGrams": 200,
        "calories": 1070,
        "protein": 15,
        "carbs": 116,
        "fat": 60,
        "fiber": 4,
        "sugar": 114
      },
      {
        "name": "4 Becher Sahne",
        "amountGrams": 800,
        "calories": 2336,
        "protein": 19.2,
        "carbs": 25.6,
        "fat": 240,
        "fiber": 0,
        "sugar": 25.6
      }
    ],
    "instructions": [
      "Eier trennen, Eiweiß mit Wasser zu steifem Schnee schlagen. Eigelb mit Zucker und Vanillezucker schaumig rühren, mit dem Eischnee mischen, das mit Backpulver gesiebte Mehl unterrühren. 30 Minuten backen.",
      "1/3 vom Biskuitteig als Boden lassen, und 2/3 zerkleinern. 130 g Kokosflocken unter die Kuchenkrümel mischen. Die Schokolade mit einem Becher Sahne schmelzen und auskühlen lassen. Unter die Kuchenkrümel heben. 2 Becher Sahne steif schlagen und auch unterheben.",
      "Die Masse kuppelförmig auf den Boden geben. 1 Becher Sahne steif schlagen, auf den Kuchen streichen und mit den restlichen Kokosflocken bestreuen.",
      "Den Kuchen kaltstellen und 3 Tage ziehen lassen.",
      "Der Kuchen lässt sich auch sehr gut einfrieren."
    ],
    "imageUrl": "recipes/397bf472-af4d-405f-93e0-69d9e100875b.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1855,
    "cookedWeight": 1670,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 139,
    "calories100g": 384,
    "protein100g": 5.5,
    "carbs100g": 29,
    "fat100g": 27.1,
    "fiber100g": 2.4,
    "sugar100g": 22.4,
    "createdAt": 1791626514025
  },
  {
    "name": "STREUSELBROT, SÜSS",
    "category": "bread",
    "ingredients": [
      {
        "name": "200 g Milch",
        "amountGrams": 200,
        "calories": 128,
        "protein": 6.6,
        "carbs": 9.6,
        "fat": 7.2,
        "fiber": 0,
        "sugar": 9.6
      },
      {
        "name": "50 g Butter",
        "amountGrams": 50,
        "calories": 359,
        "protein": 0.4,
        "carbs": 0.4,
        "fat": 40.6,
        "fiber": 0,
        "sugar": 0.4
      },
      {
        "name": "1/2 Würfel Hefe",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "25 g Vanilezucker, selbstgemacht sonst ein Päckchen",
        "amountGrams": 25,
        "calories": 97,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "fiber": 0,
        "sugar": 25
      },
      {
        "name": "60 g Zucker",
        "amountGrams": 60,
        "calories": 232,
        "protein": 0,
        "carbs": 60,
        "fat": 0,
        "fiber": 0,
        "sugar": 60
      },
      {
        "name": "1 Ei",
        "amountGrams": 55,
        "calories": 83,
        "protein": 2.2,
        "carbs": 11,
        "fat": 2.8,
        "fiber": 0.6,
        "sugar": 1.7
      },
      {
        "name": "400 g Mehl",
        "amountGrams": 400,
        "calories": 1372,
        "protein": 41.2,
        "carbs": 284,
        "fat": 4,
        "fiber": 12.8,
        "sugar": 2.8
      },
      {
        "name": "Streusel",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "200 g Mehl",
        "amountGrams": 200,
        "calories": 686,
        "protein": 20.6,
        "carbs": 142,
        "fat": 2,
        "fiber": 6.4,
        "sugar": 1.4
      },
      {
        "name": "90 g Zucker",
        "amountGrams": 90,
        "calories": 348,
        "protein": 0,
        "carbs": 90,
        "fat": 0,
        "fiber": 0,
        "sugar": 90
      },
      {
        "name": "25 g Vanillezucker, selbst gemacht, sonst ein Päckchen",
        "amountGrams": 25,
        "calories": 98,
        "protein": 0,
        "carbs": 24.5,
        "fat": 0,
        "fiber": 0,
        "sugar": 24.5
      },
      {
        "name": "100 g Butter",
        "amountGrams": 100,
        "calories": 717,
        "protein": 0.7,
        "carbs": 0.7,
        "fat": 81.1,
        "fiber": 0,
        "sugar": 0.7
      },
      {
        "name": "zum Bestreichen",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "50 g Butter, zerlassen",
        "amountGrams": 50,
        "calories": 359,
        "protein": 0.4,
        "carbs": 0.4,
        "fat": 40.6,
        "fiber": 0,
        "sugar": 0.4
      },
      {
        "name": "2 EL Milch",
        "amountGrams": 30,
        "calories": 19,
        "protein": 1,
        "carbs": 1.4,
        "fat": 1.1,
        "fiber": 0,
        "sugar": 1.4
      }
    ],
    "instructions": [
      "Hefeteig",
      "1. Milch, Butter, Hefe, Vanillezucker und Zucker in den geben. 3 min,37 Grad auf Stufe 2 mischen.",
      "Dann Mehl und Ei dazu geben und 3min auf kneten lassen.",
      "Teig in eine Schüssel geben und 30 bis 45 min gehen lassen bis sich der Teig deutlich vergrößert hat.",
      "In der Zwischenzeit die Zutaten für die Streusel in den geben und 20 sec auf Stufe 4-5 mischen.",
      "Wenn der Teig gegangen ist ihn auf eine bemehlte Fläche geben, kurz durchkneten, sollte er noch kleben etwas Mehl dazu nehmen.",
      "Den Teig auf etwa 30x30 cm ausrollen und mit der Butter bestreichen. Die Streusel darauf verteilen.",
      "Den Teig locker aufrollen und mit der Naht nach unten auf ein mit Backpapier belegtes Blech legen. Den Teig mit einem scharfen Messer etwa 2 cm tief einschneiden.",
      "Nochmals zugedeckt gehen lassen bis er sich vergrößert hat.",
      "Den Ofen aufheizen : Ober/Unterhitze ca 180 Grad oder Umluft ca 160 Grad.",
      "Das Brot mit der Milch bestreichen und ca 25-35 Min backen.",
      "Ich habe leider etwas zu tief eingeschnitten daher ist er sehr weit auseinander gegangen",
      "1",
      "2. Beschreiben Sie hier die Zubereitungsschritte Ihres Rezeptes",
      "1",
      "3. Beschreiben Sie hier die Zubereitungsschritte Ihres Rezeptes",
      "1",
      "4. Beschreiben Sie hier die Zubereitungsschritte Ihres Rezeptes"
    ],
    "imageUrl": "recipes/a19ecdc7-5623-43b6-b90f-c0f2ae39d0df.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1585,
    "cookedWeight": 1427,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 119,
    "calories100g": 343,
    "protein100g": 6,
    "carbs100g": 49.7,
    "fat100g": 13.3,
    "fiber100g": 1.5,
    "sugar100g": 15.7,
    "createdAt": 1791626514025
  },
  {
    "name": "Sachertorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "200 g Zartbitterschokolade",
        "amountGrams": 200,
        "calories": 1070,
        "protein": 10,
        "carbs": 104,
        "fat": 66,
        "fiber": 14,
        "sugar": 96
      },
      {
        "name": "8 Ei(er)",
        "amountGrams": 440,
        "calories": 629,
        "protein": 55.4,
        "carbs": 3.1,
        "fat": 41.8,
        "fiber": 0,
        "sugar": 3.1
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "200 g Butter",
        "amountGrams": 200,
        "calories": 1434,
        "protein": 1.4,
        "carbs": 1.4,
        "fat": 162.2,
        "fiber": 0,
        "sugar": 1.4
      },
      {
        "name": "300 g Zucker",
        "amountGrams": 300,
        "calories": 1161,
        "protein": 0,
        "carbs": 300,
        "fat": 0,
        "fiber": 0,
        "sugar": 300
      },
      {
        "name": "1 TL Backpulver",
        "amountGrams": 5,
        "calories": 5,
        "protein": 0.3,
        "carbs": 1,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "300 g Mehl",
        "amountGrams": 300,
        "calories": 1029,
        "protein": 30.9,
        "carbs": 213,
        "fat": 3,
        "fiber": 9.6,
        "sugar": 2.1
      },
      {
        "name": "20 g Kakao",
        "amountGrams": 20,
        "calories": 64,
        "protein": 4,
        "carbs": 2.8,
        "fat": 2.8,
        "fiber": 6,
        "sugar": 0.2
      },
      {
        "name": "300 g Aprikosenkonfitüre",
        "amountGrams": 300,
        "calories": 450,
        "protein": 12,
        "carbs": 60,
        "fat": 15,
        "fiber": 3,
        "sugar": 9
      },
      {
        "name": "40 ml Wasser",
        "amountGrams": 40,
        "calories": 2,
        "protein": 0.1,
        "carbs": 0.2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0.1
      },
      {
        "name": "30 g Zucker",
        "amountGrams": 30,
        "calories": 116,
        "protein": 0,
        "carbs": 30,
        "fat": 0,
        "fiber": 0,
        "sugar": 30
      },
      {
        "name": "20 ml Rum (nach Belieben)",
        "amountGrams": 20,
        "calories": 48,
        "protein": 0,
        "carbs": 2,
        "fat": 0,
        "fiber": 0,
        "sugar": 2
      },
      {
        "name": "200 ml Sahne",
        "amountGrams": 200,
        "calories": 584,
        "protein": 4.8,
        "carbs": 6.4,
        "fat": 60,
        "fiber": 0,
        "sugar": 6.4
      },
      {
        "name": "30 g Butter",
        "amountGrams": 30,
        "calories": 215,
        "protein": 0.2,
        "carbs": 0.2,
        "fat": 24.3,
        "fiber": 0,
        "sugar": 0.2
      },
      {
        "name": "200 g Zartbitterschokolade",
        "amountGrams": 200,
        "calories": 1070,
        "protein": 10,
        "carbs": 104,
        "fat": 66,
        "fiber": 14,
        "sugar": 96
      }
    ],
    "instructions": [
      "Schokolade grob zerkleinern, über einem Wasserbad schmelzen und etwas abkühlen lassen.",
      "Eier trennen und die Eiweiße mit der Prise Salz eine Minute anschlagen. Anschließend 250 g des Zuckers langsam einrieseln lassen und etwa fünf bis sieben Minuten zu einem festen Schnee schlagen.",
      "In einer weiteren Schüssel die Butter verrühren und mit den restlichen 50 g Zucker cremig aufschlagen.",
      "In der Zwischenzeit die trockenen Zutaten, also Mehl mit Backpulver und Kakao vermischen und sieben.",
      "In die Buttermasse nach und nach die Eigelbe einrühren. Die weiche Schokolade zugeben und ein bis zwei Minuten verrühren. Anschließend den Eischnee in drei Portionen vorsichtig und behutsam unterheben. In zwei bis drei Portionen die gesiebten trockenen Zutaten unterheben.",
      "Den Teig in eine mit Backpapier ausgelegte und gefettete Springform (Durchmesser 26 cm) geben und im vorgeheizten Ofen bei 170 ° Ober-/Unterhitze 50 bis 60 Minuten backen. Wenn nach der Stäbchenprobe nichts mehr am Stäbchen hängen bleibt, den Kuchen 20 Minuten in der Form auskühlen lassen, bevor er aus der Form gelöst und komplett auskühlen darf.",
      "Für die Tränke wird das Wasser mit dem Zucker kurz zum Kochen gebracht, bis sich der Zucker gelöst hat. Anschließend vom Herd nehmen und den Rum unterrühren.",
      "Wenn der Kuchen vollständig abgekühlt ist, in der Mitte waagerecht durchschneiden und die untere Hälfte mit der Tränke komplett beträufeln. Darüber etwa 150 g (etwa zwei Esslöffel) der Konfitüre verteilen. Den oberen Boden wieder aufsetzen.",
      "Restliche Konfitüre erhitzen, bis sie deutlich dünnflüssiger ist. Danach durch ein Haarsieb streichen, damit keine Stückchen mehr in der Konfitüre sind. Noch heiß über den Kuchen (Oberfläche und Seiten) verteilen und verstreichen. Den Kuchen 20 - 30 Minuten im Kühlschrank ruhen lassen.",
      "Für den Schokoladenüberzug wird die Sahne mit der Butter aufgekocht und über die gehackte Schokolade gegossen. Fünf Minuten bedeckt stehen lassen und anschließend solange mit einem Teigschaber oder Löffel (kein Schneebesen) rühren, bis sich eine gleichmäßige, homogene Schokomasse gebildet hat. Diese durch ein Haarsieb geben, damit keine Luftblasen oder Klümpchen übrig bleiben.",
      "Die Schokoladenmasse großzügig auf dem Kuchen verteilen. Dazu am besten den Kuchen auf ein Abkühlgitter geben, ein Backblech o. ä. darunterstellen. Die Schokolade auf den Kuchen geben und mit einem Teigschaber verteilen. Die restliche Schokolade kann nun nach unten ablaufen und wird auf dem Backblech aufgefangen und so landet sie nicht auf eurer Arbeitsfläche. Die Schokolade mit einer Winkelpalette auf der Oberfläche und an den Seiten glatt streichen.",
      "Tipp: Durch Aufklopfen des Kuchens auf der Arbeitsfläche zieht sich die Oberfläche noch schön glatt.",
      "Kuchen nach Belieben verzieren – fertig!",
      "Eine Sachertorte schmeckt am besten, wenn sie mehrere Tage durchgezogen ist."
    ],
    "imageUrl": "recipes/83be4a4b-56c0-4e82-9ec2-036401910447.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2385,
    "cookedWeight": 2147,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 179,
    "calories100g": 367,
    "protein100g": 6,
    "carbs100g": 38.6,
    "fat100g": 20.5,
    "fiber100g": 2.2,
    "sugar100g": 25.5,
    "createdAt": 1791626514025
  },
  {
    "name": "Saftiger Zitronenkuchen",
    "category": "bread",
    "ingredients": [
      {
        "name": "350 g Butter, oder Margarine",
        "amountGrams": 350,
        "calories": 2510,
        "protein": 2.4,
        "carbs": 2.4,
        "fat": 283.8,
        "fiber": 0,
        "sugar": 2.4
      },
      {
        "name": "350 g Zucker",
        "amountGrams": 350,
        "calories": 1355,
        "protein": 0,
        "carbs": 350,
        "fat": 0,
        "fiber": 0,
        "sugar": 350
      },
      {
        "name": "350 g Mehl",
        "amountGrams": 350,
        "calories": 1201,
        "protein": 36.1,
        "carbs": 248.5,
        "fat": 3.5,
        "fiber": 11.2,
        "sugar": 2.4
      },
      {
        "name": "6 Ei(er)",
        "amountGrams": 330,
        "calories": 472,
        "protein": 41.6,
        "carbs": 2.3,
        "fat": 31.4,
        "fiber": 0,
        "sugar": 2.3
      },
      {
        "name": "1 Zitrone(n), Saft davon",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      },
      {
        "name": "1 Pck. Vanillinzucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "1 Pck. Backpulver",
        "amountGrams": 15,
        "calories": 15,
        "protein": 0.8,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Pck. Aroma (Zitronenschale)",
        "amountGrams": 250,
        "calories": 73,
        "protein": 2.8,
        "carbs": 23.3,
        "fat": 0.8,
        "fiber": 7,
        "sugar": 6.3
      },
      {
        "name": "1 Zitrone(n), Saft davon",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      },
      {
        "name": "300 g Puderzucker",
        "amountGrams": 300,
        "calories": 1167,
        "protein": 0,
        "carbs": 300,
        "fat": 0,
        "fiber": 0,
        "sugar": 300
      }
    ],
    "instructions": [
      "Alle Zutaten gut verrühren und auf ein mit Backpapier ausgelegtes Blech geben.",
      "Backzeit 20-25 Min. bei 140° bis 150°.",
      "Bitte Stäbchenprobe machen, da die Backzeit durch verschiedene Backöfen/Blechhöhen variieren kann.",
      "Für den Guss den Zitronensaft gut mit dem Puderzucker verrühren und auf dem noch warmen Kuchen verteilen."
    ],
    "imageUrl": "recipes/d9857f84-7348-49e4-b165-38a913406b2b.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2153,
    "cookedWeight": 1938,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 162,
    "calories100g": 355,
    "protein100g": 4.4,
    "carbs100g": 49.3,
    "fat100g": 16.5,
    "fiber100g": 1.2,
    "sugar100g": 34.9,
    "createdAt": 1791626514025
  },
  {
    "name": "Schokokuchen Wie Im McCafe",
    "category": "bread",
    "ingredients": [
      {
        "name": "200 g Margarine",
        "amountGrams": 200,
        "calories": 1440,
        "protein": 0.4,
        "carbs": 1,
        "fat": 160,
        "fiber": 0,
        "sugar": 1
      },
      {
        "name": "200 g Schokolade, zartbitter (mind. 50 % Kakao), hochwertige",
        "amountGrams": 200,
        "calories": 640,
        "protein": 40,
        "carbs": 28,
        "fat": 28,
        "fiber": 60,
        "sugar": 2
      },
      {
        "name": "200 g Zucker",
        "amountGrams": 200,
        "calories": 774,
        "protein": 0,
        "carbs": 200,
        "fat": 0,
        "fiber": 0,
        "sugar": 200
      },
      {
        "name": "4 m.-große Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "200 g Mandel(n), gemahlen",
        "amountGrams": 200,
        "calories": 300,
        "protein": 8,
        "carbs": 40,
        "fat": 10,
        "fiber": 2,
        "sugar": 6
      },
      {
        "name": "1 Pck. Vanillinzucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "1 Pck. Backpulver",
        "amountGrams": 15,
        "calories": 15,
        "protein": 0.8,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "100 g Schokolade, vollmilch",
        "amountGrams": 100,
        "calories": 64,
        "protein": 3.3,
        "carbs": 4.8,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 4.8
      },
      {
        "name": "70 g Sahne",
        "amountGrams": 70,
        "calories": 204,
        "protein": 1.7,
        "carbs": 2.2,
        "fat": 21,
        "fiber": 0,
        "sugar": 2.2
      },
      {
        "name": "25 g Palmfett",
        "amountGrams": 25,
        "calories": 38,
        "protein": 1,
        "carbs": 5,
        "fat": 1.3,
        "fiber": 0.3,
        "sugar": 0.8
      }
    ],
    "instructions": [
      "Die Margarine schmelzen und 100 g Zartbitterschokolade, 100 g Vollmilchschokolade, Eier, Mandeln, Zucker, Vanillinzucker, Backpulver und Salz mischen.",
      "Bei 160°C 45 min. in einer Springform backen. Den Rand der Springform evtl. mit Backpapier auslegen (so löst sich später der Guss leichter). Anschließend abkühlen lassen.",
      "Für die Glasur Sahne und Palmfett auflösen und die Schokolade darin langsam erwärmen, bis alles schön geschmolzen ist. Gleichmäßig auf den Kuchen gießen und durch Schwenken gleichmäßig verteilen. Danach langsam kalt werden lassen."
    ],
    "imageUrl": "recipes/c1642b29-2496-4587-bc28-22f4a07bce93.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 1338,
    "cookedWeight": 1204,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 100,
    "calories100g": 318,
    "protein100g": 6.9,
    "carbs100g": 24.4,
    "fat100g": 20.3,
    "fiber100g": 5.2,
    "sugar100g": 18.8,
    "createdAt": 1791626514025
  },
  {
    "name": "Schokoladen - Himbeertorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "150 g Schokolade",
        "amountGrams": 150,
        "calories": 803,
        "protein": 11.3,
        "carbs": 87,
        "fat": 45,
        "fiber": 3,
        "sugar": 85.5
      },
      {
        "name": "150 g Butter",
        "amountGrams": 150,
        "calories": 1076,
        "protein": 1,
        "carbs": 1,
        "fat": 121.7,
        "fiber": 0,
        "sugar": 1
      },
      {
        "name": "100 g Zucker",
        "amountGrams": 100,
        "calories": 387,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0,
        "sugar": 100
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "6 Ei(er)",
        "amountGrams": 330,
        "calories": 472,
        "protein": 41.6,
        "carbs": 2.3,
        "fat": 31.4,
        "fiber": 0,
        "sugar": 2.3
      },
      {
        "name": "100 g Mehl",
        "amountGrams": 100,
        "calories": 343,
        "protein": 10.3,
        "carbs": 71,
        "fat": 1,
        "fiber": 3.2,
        "sugar": 0.7
      },
      {
        "name": "50 g Speisestärke",
        "amountGrams": 50,
        "calories": 175,
        "protein": 0.3,
        "carbs": 43,
        "fat": 0.1,
        "fiber": 0.3,
        "sugar": 0
      },
      {
        "name": "1 TL Backpulver",
        "amountGrams": 5,
        "calories": 5,
        "protein": 0.3,
        "carbs": 1,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Für die Creme: (Schokocreme)",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "300 g Schlagsahne",
        "amountGrams": 300,
        "calories": 876,
        "protein": 7.2,
        "carbs": 9.6,
        "fat": 90,
        "fiber": 0,
        "sugar": 9.6
      },
      {
        "name": "200 g Schokolade",
        "amountGrams": 200,
        "calories": 1070,
        "protein": 15,
        "carbs": 116,
        "fat": 60,
        "fiber": 4,
        "sugar": 114
      },
      {
        "name": "Für die Creme: (Himbeercreme)",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "150 g Himbeeren, püriert",
        "amountGrams": 150,
        "calories": 78,
        "protein": 1.8,
        "carbs": 18,
        "fat": 1,
        "fiber": 9.8,
        "sugar": 6.6
      },
      {
        "name": "100 g Himbeeren",
        "amountGrams": 100,
        "calories": 52,
        "protein": 1.2,
        "carbs": 12,
        "fat": 0.7,
        "fiber": 6.5,
        "sugar": 4.4
      },
      {
        "name": "250 g Schlagsahne",
        "amountGrams": 250,
        "calories": 730,
        "protein": 6,
        "carbs": 8,
        "fat": 75,
        "fiber": 0,
        "sugar": 8
      },
      {
        "name": "2 EL Wasser",
        "amountGrams": 30,
        "calories": 2,
        "protein": 0.1,
        "carbs": 0.2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0.1
      },
      {
        "name": "1 1/2 Blätter Gelatine",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "200 g Schlagsahne",
        "amountGrams": 200,
        "calories": 584,
        "protein": 4.8,
        "carbs": 6.4,
        "fat": 60,
        "fiber": 0,
        "sugar": 6.4
      },
      {
        "name": "130 g Schokolade",
        "amountGrams": 130,
        "calories": 696,
        "protein": 9.8,
        "carbs": 75.4,
        "fat": 39,
        "fiber": 2.6,
        "sugar": 74.1
      },
      {
        "name": "100 g Mandelblättchen, geröstet",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Für den Teig die Schokolade in einem Wasserbad schmelzen. Die Eier trennen und die Eiweiße mit dem Zucker steif schlagen. Die Eigelbe mit Salz und Vanillezucker cremig schlagen. Butter unterrühren und anschließend die geschmolzene Schokolade hinzugeben. Das Mehl mit dem Backpulver mischen und abwechselnd mit dem Eiweiß unterheben.",
      "Den Teig in eine Springform (26 cm) geben und bei 160°C Umluft (oder 180°C Ober-/Unterhitze) 40 min. backen. Den ausgekühlten Boden zweimal durchschneiden.",
      "Für die Schokocreme die Schlagsahne kurz aufkochen lassen und die Schokolade darin schmelzen. Die Masse abkühlen lassen (ca. 3 Stunden), bis sie fast fest ist. Nun die Creme aufschlagen. Hierbei hellt sich die Farbe der Creme auf.",
      "Die Schokocreme auf einen Schokoboden geben und glatt streichen, mit dem zweiten Schokoboden belegen und etwas andrücken.",
      "Für die Himbeercreme die Himbeeren pürieren (TK-Himbeeren vorher auftauen lassen) und wer mag, durch ein Sieb streichen. Geschlagene Sahne mit dem Püree mischen. Die Gelatine in heißem Wasser auflösen und zur Himbeermasse geben. Anschließend die Himbeeren unterheben. Die Himbeercreme auf dem Schokoboden verteilen und den letzten Boden darauflegen.",
      "Mit der Schokocreme für die Dekoration (diese gleichzeitig mit der Schokofüllung zubereiten) die Oberfläche und den Rand bestreichen und mit dem Rest der Creme die Torte beliebig dekorieren. Den Rand mit gerösteten Mandelblättchen garnieren."
    ],
    "imageUrl": "recipes/37bd4ea9-8e36-4d00-a656-7549724995d0.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2753,
    "cookedWeight": 2478,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 207,
    "calories100g": 322,
    "protein100g": 5.1,
    "carbs100g": 25.8,
    "fat100g": 22,
    "fiber100g": 1.4,
    "sugar100g": 17.5,
    "createdAt": 1791626514026
  },
  {
    "name": "Schwarzwälder Erdbeertorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "4 Ei(er)",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "125 g Zucker",
        "amountGrams": 125,
        "calories": 484,
        "protein": 0,
        "carbs": 125,
        "fat": 0,
        "fiber": 0,
        "sugar": 125
      },
      {
        "name": "1 Pck. Vanillinzucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "20 g Kakaopulver",
        "amountGrams": 20,
        "calories": 64,
        "protein": 4,
        "carbs": 2.8,
        "fat": 2.8,
        "fiber": 6,
        "sugar": 0.2
      },
      {
        "name": "50 g Mehl",
        "amountGrams": 50,
        "calories": 172,
        "protein": 5.2,
        "carbs": 35.5,
        "fat": 0.5,
        "fiber": 1.6,
        "sugar": 0.4
      },
      {
        "name": "50 g Speisestärke",
        "amountGrams": 50,
        "calories": 175,
        "protein": 0.3,
        "carbs": 43,
        "fat": 0.1,
        "fiber": 0.3,
        "sugar": 0
      },
      {
        "name": "1 TL Backpulver",
        "amountGrams": 5,
        "calories": 5,
        "protein": 0.3,
        "carbs": 1,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "500 g Erdbeeren",
        "amountGrams": 500,
        "calories": 160,
        "protein": 3.5,
        "carbs": 38.5,
        "fat": 1.5,
        "fiber": 10,
        "sugar": 24.5
      },
      {
        "name": "2 EL Speisestärke",
        "amountGrams": 30,
        "calories": 105,
        "protein": 0.2,
        "carbs": 25.8,
        "fat": 0,
        "fiber": 0.2,
        "sugar": 0
      },
      {
        "name": "150 ml Johannisbeersaft, roter",
        "amountGrams": 150,
        "calories": 225,
        "protein": 6,
        "carbs": 30,
        "fat": 7.5,
        "fiber": 1.5,
        "sugar": 4.5
      },
      {
        "name": "3 EL Zucker",
        "amountGrams": 45,
        "calories": 174,
        "protein": 0,
        "carbs": 45,
        "fat": 0,
        "fiber": 0,
        "sugar": 45
      },
      {
        "name": "750 g Schlagsahne",
        "amountGrams": 750,
        "calories": 2190,
        "protein": 18,
        "carbs": 24,
        "fat": 225,
        "fiber": 0,
        "sugar": 24
      },
      {
        "name": "3 Pck. Sahnesteif",
        "amountGrams": 24,
        "calories": 70,
        "protein": 0.6,
        "carbs": 0.8,
        "fat": 7.2,
        "fiber": 0,
        "sugar": 0.8
      },
      {
        "name": "1 Pck. Vanillinzucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "3 EL Orangenlikör",
        "amountGrams": 45,
        "calories": 108,
        "protein": 0,
        "carbs": 4.5,
        "fat": 0,
        "fiber": 0,
        "sugar": 4.5
      },
      {
        "name": "150 g Konfitüre (Erdbeerkonfitüre)",
        "amountGrams": 150,
        "calories": 225,
        "protein": 6,
        "carbs": 30,
        "fat": 7.5,
        "fiber": 1.5,
        "sugar": 4.5
      },
      {
        "name": "50 g Schokolade, zartbitter",
        "amountGrams": 50,
        "calories": 268,
        "protein": 3.8,
        "carbs": 29,
        "fat": 15,
        "fiber": 1,
        "sugar": 28.5
      },
      {
        "name": "3 Stiele Minze",
        "amountGrams": 300,
        "calories": 450,
        "protein": 12,
        "carbs": 60,
        "fat": 15,
        "fiber": 3,
        "sugar": 9
      }
    ],
    "instructions": [
      "Für den Biskuit die Eier trennen. Eiweiße mit 4 EL kaltem Wasser sehr steif schlagen. Zucker, Vanillinzucker und Salz einrieseln lassen. Eigelbe unterrühren. Kakao, Mehl, Speisestärke und Backpulver auf die Eimasse sieben, unterheben. Den Boden einer Springform (26 cm Durchmesser) mit Backpapier auslegen. Den Teig einfüllen und glatt streichen. Im vorgeheizten Backofen bei 200° ca. 15 Minuten backen.",
      "Die Erdbeeren putzen und klein schneiden. Die Speisestärke mit 3-4 EL Saft glatt rühren. Den restlichen Saft mit 1 EL Zucker aufkochen. Die angerührte Speisestärke einrühren. Die Erdbeeren unterheben und alles abkühlen lassen.",
      "Sahne, Sahnesteif, Vanillinzucker und den restlichen Zucker steif schlagen.",
      "Den ausgekühlten Biskuit zweimal durchschneiden. Die Böden mit Likör beträufeln. Den Springformrand um den untersten Boden legen, das Erdbeerkompott darauf verteilen. Ein Viertel der Sahne darauf streichen. Mit dem zweiten Boden bedecken und diesen mit erwärmter Marmelade bestreichen. Ein weiteres Viertel der Sahne darauf verteilen, mit dem letzten Boden bedecken und leicht andrücken.",
      "Die Torte rundherum mit der restliche Sahne, bis auf 50 g, bestreichen. Von der gut gekühlten Schokolade mit einem Sparschäler kleine Locken abziehen und den Tortenrand damit verzieren. Die restliche Sahne in einen Spritzbeutel mit Sterntülle füllen und Tuffs auf die Torte spritzen. Die Tuffs mit Minzeblättchen und Erdbeerhälften verzieren und etwas erwärmte Marmelade darüber gießen."
    ],
    "imageUrl": "recipes/9e5820a2-b70c-4919-a2e7-5f04e6163911.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2630,
    "cookedWeight": 2367,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 197,
    "calories100g": 222,
    "protein100g": 3.7,
    "carbs100g": 21.7,
    "fat100g": 12.8,
    "fiber100g": 1.1,
    "sugar100g": 12.2,
    "createdAt": 1791626514026
  },
  {
    "name": "Schwarzwälder Kirschtorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "5 Ei(er)",
        "amountGrams": 275,
        "calories": 393,
        "protein": 34.7,
        "carbs": 1.9,
        "fat": 26.1,
        "fiber": 0,
        "sugar": 1.9
      },
      {
        "name": "175 g Zucker",
        "amountGrams": 175,
        "calories": 677,
        "protein": 0,
        "carbs": 175,
        "fat": 0,
        "fiber": 0,
        "sugar": 175
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "125 g Mehl",
        "amountGrams": 125,
        "calories": 429,
        "protein": 12.9,
        "carbs": 88.8,
        "fat": 1.3,
        "fiber": 4,
        "sugar": 0.9
      },
      {
        "name": "2 TL, gestr. Backpulver",
        "amountGrams": 10,
        "calories": 10,
        "protein": 0.5,
        "carbs": 2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "50 g Speisestärke",
        "amountGrams": 50,
        "calories": 175,
        "protein": 0.3,
        "carbs": 43,
        "fat": 0.1,
        "fiber": 0.3,
        "sugar": 0
      },
      {
        "name": "15 g Kakaopulver, ungesüßt",
        "amountGrams": 15,
        "calories": 48,
        "protein": 3,
        "carbs": 2.1,
        "fat": 2.1,
        "fiber": 4.5,
        "sugar": 0.2
      },
      {
        "name": "Für die Füllung: (Kirschfüllung)",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      },
      {
        "name": "350 g Sauerkirschen aus dem Glas",
        "amountGrams": 350,
        "calories": 221,
        "protein": 3.5,
        "carbs": 56,
        "fat": 0.7,
        "fiber": 5.6,
        "sugar": 44.8
      },
      {
        "name": "30 g Speisestärke",
        "amountGrams": 30,
        "calories": 105,
        "protein": 0.2,
        "carbs": 25.8,
        "fat": 0,
        "fiber": 0.2,
        "sugar": 0
      },
      {
        "name": "25 g Zucker",
        "amountGrams": 25,
        "calories": 97,
        "protein": 0,
        "carbs": 25,
        "fat": 0,
        "fiber": 0,
        "sugar": 25
      },
      {
        "name": "3 EL Kirschwasser",
        "amountGrams": 45,
        "calories": 108,
        "protein": 0,
        "carbs": 4.5,
        "fat": 0,
        "fiber": 0,
        "sugar": 4.5
      },
      {
        "name": "Für die Füllung: (Sahnefüllung)",
        "amountGrams": 100,
        "calories": 292,
        "protein": 2.4,
        "carbs": 3.2,
        "fat": 30,
        "fiber": 0,
        "sugar": 3.2
      },
      {
        "name": "800 g Schlagsahne",
        "amountGrams": 800,
        "calories": 2336,
        "protein": 19.2,
        "carbs": 25.6,
        "fat": 240,
        "fiber": 0,
        "sugar": 25.6
      },
      {
        "name": "40 g Zucker",
        "amountGrams": 40,
        "calories": 155,
        "protein": 0,
        "carbs": 40,
        "fat": 0,
        "fiber": 0,
        "sugar": 40
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "2 Pck. Sahnesteif",
        "amountGrams": 16,
        "calories": 47,
        "protein": 0.4,
        "carbs": 0.5,
        "fat": 4.8,
        "fiber": 0,
        "sugar": 0.5
      },
      {
        "name": "100 g Schokoladenraspel",
        "amountGrams": 100,
        "calories": 535,
        "protein": 7.5,
        "carbs": 58,
        "fat": 30,
        "fiber": 2,
        "sugar": 57
      },
      {
        "name": "50 g Kirsche(n)",
        "amountGrams": 50,
        "calories": 75,
        "protein": 2,
        "carbs": 10,
        "fat": 2.5,
        "fiber": 0.5,
        "sugar": 1.5
      }
    ],
    "instructions": [
      "Die Eier trennen. Die Eiweiße mit Hälfte des Zuckers steif schlagen. Die Eigelbe mit dem übrigen Zucker cremig schlagen. Dann die Eigelbmasse auf das Eiweiß geben und unterrühren. Das Mehl mit Backpulver, Speisestärke und Kakao mischen und vorsichtig auf die Teigmischung sieben. Den Vanillezucker dazugeben. Alle Zutaten mit einem Löffel vermengen.",
      "Den Teig in einer mit Backpapier ausgelegten Springform glatt streichen, auf den Rost in den vorgeheizten Backofen schieben und bei 180°C Ober-/Unterhitze ca. 25 Minuten backen. Nach dem Backen den Springformrand entfernen, den Boden auf einen mit Backpapier belegten Kuchenrost stürzen. Den Springformboden entfernen und den Biskuitboden erkalten lassen.",
      "Für die Kirschfüllung die Sauerkirschen auf einem Sieb gut abtropfen lassen. Die Flüssigkeit dabei auffangen und 250 ml abmessen. Die Speisestärke mit Zucker und 4 EL von der Flüssigkeit anrühren. Die übrige Flüssigkeit zum Kochen bringen, die angerührte Stärke in die vom Herd genommene Flüssigkeit einrühren, kurz aufkochen, die Kirschen unterrühren und kaltstellen. Mit Kirschwasser abschmecken.",
      "Die Sahne mit Zucker, Vanillezucker und Sahnesteif sehr steif schlagen. Da es sich um sehr viel Sahne handelt, empfiehlt es sich, die Sahne in zwei Etappen steif zu schlagen.",
      "Von dem Biskuitboden das mitgebackene Backpapier vorsichtig abziehen und den Boden zweimal waagerecht mit einem großen, scharfen Messer durchschneiden. Den unteren Boden auf eine Tortenplatte legen, den Springformring wieder anlegen, dadurch lässt sich die Torte leichter stapeln.",
      "Die Kirschmasse und 1/3 der Sahnecreme draufstreichen. Den mittleren Boden auflegen, leicht andrücken und mit der Hälfte der restlichen Sahnecreme bestreichen. Den oberen Boden auflegen und leicht andrücken. 3 EL der Sahnecreme in einen Spritzbeutel mit Sterntülle füllen und beiseitelegen.",
      "Die Tortenoberfläche und den Tortenrand mit der übrigen Creme einstreichen. Mit der Creme aus dem Spritzbeutel, Raspelschokolade und Kirschen verzieren."
    ],
    "imageUrl": "recipes/1631fa3f-030c-49a4-8f4b-87d19b108e9c.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2322,
    "cookedWeight": 2090,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 174,
    "calories100g": 283,
    "protein100g": 4.3,
    "carbs100g": 28.6,
    "fat100g": 16.4,
    "fiber100g": 0.9,
    "sugar100g": 19.1,
    "createdAt": 1791626514026
  },
  {
    "name": "Tiramisutorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "6 Ei(er), getrennt",
        "amountGrams": 330,
        "calories": 472,
        "protein": 41.6,
        "carbs": 2.3,
        "fat": 31.4,
        "fiber": 0,
        "sugar": 2.3
      },
      {
        "name": "250 g Zucker",
        "amountGrams": 250,
        "calories": 968,
        "protein": 0,
        "carbs": 250,
        "fat": 0,
        "fiber": 0,
        "sugar": 250
      },
      {
        "name": "150 g Mehl",
        "amountGrams": 150,
        "calories": 515,
        "protein": 15.5,
        "carbs": 106.5,
        "fat": 1.5,
        "fiber": 4.8,
        "sugar": 1
      },
      {
        "name": "5 Eigelb",
        "amountGrams": 275,
        "calories": 886,
        "protein": 44,
        "carbs": 9.9,
        "fat": 74.3,
        "fiber": 0,
        "sugar": 1.7
      },
      {
        "name": "750 g Mascarpone",
        "amountGrams": 750,
        "calories": 3000,
        "protein": 33.8,
        "carbs": 22.5,
        "fat": 307.5,
        "fiber": 0,
        "sugar": 22.5
      },
      {
        "name": "200 ml Espresso, kalter",
        "amountGrams": 200,
        "calories": 4,
        "protein": 0.2,
        "carbs": 0.6,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "50 ml Amaretto",
        "amountGrams": 50,
        "calories": 120,
        "protein": 0,
        "carbs": 5,
        "fat": 0,
        "fiber": 0,
        "sugar": 5
      },
      {
        "name": "Kakaopulver",
        "amountGrams": 100,
        "calories": 320,
        "protein": 20,
        "carbs": 14,
        "fat": 14,
        "fiber": 30,
        "sugar": 1
      }
    ],
    "instructions": [
      "Für den Teig den Backofen auf 175°C vorheizen. Eine 28 cm große Springform am Boden einfetten. 5 Eier trennen. Die Eiweiße steif schlagen. Die Eigelbe mit 150 g Zucker und 2 EL warmem Wasser dick cremig aufschlagen. Den Eischnee darauf setzen und das Mehl darüber sieben. Alles locker vermengen, den Teig in die Form füllen und etwa 40 Minuten backen. Auskühlen lassen und ein- oder zweimal quer durchschneiden.",
      "Für die Creme die Eigelbe in ein hohes Gefäß geben, 100 g Zucker und die Hälfte des Amarettos mit einem Schneebesen unterrühren, danach den kompletten Mascarpone unterrühren.",
      "Den Rest des Amarettos mit dem Espresso in einer flachen Schale vermischen. Den unteren Biskuitboden mit einem Tortenring umlegen und die Amaretto-Kaffee-Mischung mit einem Löffel zur Hälfte bzw. einem Drittel darauf verteilen (je nachdem, ob man 2 oder drei Böden hat). Danach eine Schicht der Creme darauf streichen, nun wieder einen Teigboden auflegen, mit Amaretto-Kaffee-Mischung beträufeln und mit Creme bestreichen. Bei drei Böden wiederholt sich dieser Vorgang noch einmal. Die letzte Schicht Creme dick mit Kakao bestäuben. Die Tiramisutorte im Kühlschrank mindestens 4 Stunden kühlen, am besten über Nacht."
    ],
    "imageUrl": "recipes/1ed89f65-9224-4453-9aca-b49ee6157997.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 2105,
    "cookedWeight": 1895,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 158,
    "calories100g": 332,
    "protein100g": 8.2,
    "carbs100g": 21.7,
    "fat100g": 22.6,
    "fiber100g": 1.8,
    "sugar100g": 15,
    "createdAt": 1791626514026
  },
  {
    "name": "Vanillekipferl, Extramürb",
    "category": "snack",
    "ingredients": [
      {
        "name": "500 g Mehl",
        "amountGrams": 500,
        "calories": 1715,
        "protein": 51.5,
        "carbs": 355,
        "fat": 5,
        "fiber": 16,
        "sugar": 3.5
      },
      {
        "name": "½ TL Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "6 Eigelb",
        "amountGrams": 330,
        "calories": 1063,
        "protein": 52.8,
        "carbs": 11.9,
        "fat": 89.1,
        "fiber": 0,
        "sugar": 2
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "2 Pck. Vanillezucker",
        "amountGrams": 16,
        "calories": 62,
        "protein": 0,
        "carbs": 15.7,
        "fat": 0,
        "fiber": 0,
        "sugar": 15.7
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "400 g Butter - Flocken, kalt",
        "amountGrams": 400,
        "calories": 2868,
        "protein": 2.8,
        "carbs": 2.8,
        "fat": 324.4,
        "fiber": 0,
        "sugar": 2.8
      },
      {
        "name": "250 g Mandel(n), geschält, gerieben",
        "amountGrams": 250,
        "calories": 375,
        "protein": 10,
        "carbs": 50,
        "fat": 12.5,
        "fiber": 2.5,
        "sugar": 7.5
      },
      {
        "name": "150 g Puderzucker",
        "amountGrams": 150,
        "calories": 584,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      }
    ],
    "instructions": [
      "Mehl mit Backpulver vermischen und auf die saubere Tischplatte sieben. In der Mitte eine Kuhle eindrücken, dort hinein Eier, Zucker und Gewürze geben. Mit einer Gabel zu einem dicken Brei verrühren. Darauf die in Butterflocken und die Mandeln geben. Alles zu einem glatten Teig verkneten, mindestens 2 Stunden im Kühlschrank ruhen lassen.",
      "Gekühlten Teig zu fingerdicken Rollen formen, davon je 5 cm lange Stücke abschneiden und zu Hörnchen drehen. Auf mit Backpapier belegte Bleche legen. Bei 175-180 Grad im vorgeheizten Ofen je 10 Minuten hellgelb backen. Puderzucker mit Vanillezucker mischen, auf einen Teller sieben. Die fertig gebackenen Hörnchen oder Kipferl noch heiß darin wenden (vorsichtig, sie brechen leicht und sind sehr mürb). In gut schließenden Blechdosen aufbewahren."
    ],
    "imageUrl": "recipes/df5fc9aa-34ca-4fd8-847a-9719be0f39e2.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#snack"
    ],
    "totalRawWeight": 2004,
    "cookedWeight": 1804,
    "servingName": "1 Kipferl",
    "servingWeightGrams": 45,
    "calories100g": 409,
    "protein100g": 6.8,
    "carbs100g": 42.3,
    "fat100g": 23.9,
    "fiber100g": 1,
    "sugar100g": 18.8,
    "createdAt": 1791626514027
  },
  {
    "name": "Waffeln a la Philipp",
    "category": "meal",
    "ingredients": [
      {
        "name": "3 Ei(er)",
        "amountGrams": 165,
        "calories": 236,
        "protein": 20.8,
        "carbs": 1.2,
        "fat": 15.7,
        "fiber": 0,
        "sugar": 1.2
      },
      {
        "name": "125 g Zucker",
        "amountGrams": 125,
        "calories": 484,
        "protein": 0,
        "carbs": 125,
        "fat": 0,
        "fiber": 0,
        "sugar": 125
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "125 g Margarine",
        "amountGrams": 125,
        "calories": 900,
        "protein": 0.3,
        "carbs": 0.6,
        "fat": 100,
        "fiber": 0,
        "sugar": 0.6
      },
      {
        "name": "1 TL Backpulver",
        "amountGrams": 5,
        "calories": 5,
        "protein": 0.3,
        "carbs": 1,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "250 g Mehl",
        "amountGrams": 250,
        "calories": 858,
        "protein": 25.8,
        "carbs": 177.5,
        "fat": 2.5,
        "fiber": 8,
        "sugar": 1.8
      },
      {
        "name": "250 ml Milch",
        "amountGrams": 250,
        "calories": 160,
        "protein": 8.3,
        "carbs": 12,
        "fat": 9,
        "fiber": 0,
        "sugar": 12
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      }
    ],
    "instructions": [
      "Reicht für ca. 10 Waffeln.",
      "Zuerst Eier, Zucker und Vanillezucker mit einem Handrührgerät auf höchster Stufe verrühren. Anschließend Margarine hinzufügen und kurz verrühren. Abschließend Backpulver, Mehl, Milch und Salz gemeinsam hinzufügen, mixen und im gefetteten Waffeleisen goldgelb backen.",
      "Tipp: Nicht pur genießen! Beim Servieren auf die warmen Waffeln Konfitüren (Kirsch oder Aprikosen), Nutella, Puderzucker oder Zimtzucker geben. Wer die Beilage jedoch selber machen will, kann auch einfach ein Glas Sauerkirschen in einen Topf geben, etwas Speisestärke und Zucker hinzufügen. Die ganz Raffinierten rühren in den Teig schon den Extrawunsch ein (Nutella, Kakao, Äpfel)."
    ],
    "imageUrl": "recipes/099ebc27-5188-4064-8bd4-197d62c1d8c8.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 1028,
    "cookedWeight": 1028,
    "servingName": "1 Waffel",
    "servingWeightGrams": 129,
    "calories100g": 261,
    "protein100g": 5.4,
    "carbs100g": 31.7,
    "fat100g": 12.4,
    "fiber100g": 0.8,
    "sugar100g": 14.5,
    "createdAt": 1791626514027
  },
  {
    "name": "Wassermelonen-Feta Salat",
    "category": "salad",
    "ingredients": [
      {
        "name": "500 g Melone(n) (Wassermelone)",
        "amountGrams": 500,
        "calories": 150,
        "protein": 3,
        "carbs": 38,
        "fat": 1,
        "fiber": 2,
        "sugar": 31
      },
      {
        "name": "200 g Feta-Käse",
        "amountGrams": 200,
        "calories": 528,
        "protein": 28,
        "carbs": 2,
        "fat": 42,
        "fiber": 0,
        "sugar": 2
      },
      {
        "name": "8 EL Olivenöl",
        "amountGrams": 120,
        "calories": 1061,
        "protein": 0,
        "carbs": 0,
        "fat": 120,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "2 kleine Chilischote(n), getrocknet",
        "amountGrams": 110,
        "calories": 165,
        "protein": 4.4,
        "carbs": 22,
        "fat": 5.5,
        "fiber": 1.1,
        "sugar": 3.3
      }
    ],
    "instructions": [
      "Als erstes wird die Wassermelone in gleichmäßige Würfel geschnitten. Vorhandene Kerne müssen entfernt werden. Pro Portion wird ungefähr eine Hand voll Melonenwürfel auf einem Teller angerichtet. Anschließend wird ca 50 g Feta darüber gebröselt.",
      "Die Chilischoten (z.B. kleine rote Thaichili) werden zerkleinert und mit dem Öl vermengt, kurz stehen gelassen, erneut verrührt und anschließend 1-2 EL über die Melonen und den Feta gegeben. Es eignet sich auch perfekt bereits zuvor angesetztes Chili-Öl für dieses Gericht.",
      "Der Geschmack dieses Gerichtes steht und fällt mit der Qualität der Melone und des Fetas. Das Gericht lebt vom Kontrast, aus der fruchtigen, erfrischenden Wassermelone, dem salzigen, cremigen Käse und der Schärfe der Chili."
    ],
    "imageUrl": "recipes/82a92ea7-64f7-469d-ba30-2de8354f1581.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#salad"
    ],
    "totalRawWeight": 930,
    "cookedWeight": 930,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 233,
    "calories100g": 205,
    "protein100g": 3.8,
    "carbs100g": 6.7,
    "fat100g": 18.1,
    "fiber100g": 0.3,
    "sugar100g": 3.9,
    "createdAt": 1791626514028
  },
  {
    "name": "Zitronentorte",
    "category": "bread",
    "ingredients": [
      {
        "name": "4 Ei(er), getrennt",
        "amountGrams": 220,
        "calories": 315,
        "protein": 27.7,
        "carbs": 1.5,
        "fat": 20.9,
        "fiber": 0,
        "sugar": 1.5
      },
      {
        "name": "125 g Zucker",
        "amountGrams": 125,
        "calories": 484,
        "protein": 0,
        "carbs": 125,
        "fat": 0,
        "fiber": 0,
        "sugar": 125
      },
      {
        "name": "1 Pck. Vanillezucker",
        "amountGrams": 8,
        "calories": 31,
        "protein": 0,
        "carbs": 7.8,
        "fat": 0,
        "fiber": 0,
        "sugar": 7.8
      },
      {
        "name": "3 EL Wasser, warmes",
        "amountGrams": 45,
        "calories": 2,
        "protein": 0.1,
        "carbs": 0.2,
        "fat": 0,
        "fiber": 0,
        "sugar": 0.1
      },
      {
        "name": "75 g Mehl",
        "amountGrams": 75,
        "calories": 257,
        "protein": 7.7,
        "carbs": 53.3,
        "fat": 0.8,
        "fiber": 2.4,
        "sugar": 0.5
      },
      {
        "name": "50 g Speisestärke",
        "amountGrams": 50,
        "calories": 175,
        "protein": 0.3,
        "carbs": 43,
        "fat": 0.1,
        "fiber": 0.3,
        "sugar": 0
      },
      {
        "name": "1 1/2 TL Backpulver",
        "amountGrams": 100,
        "calories": 100,
        "protein": 5,
        "carbs": 20,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "8 Blätter Gelatine",
        "amountGrams": 800,
        "calories": 1200,
        "protein": 32,
        "carbs": 160,
        "fat": 40,
        "fiber": 8,
        "sugar": 24
      },
      {
        "name": "300 ml Buttermilch",
        "amountGrams": 300,
        "calories": 2151,
        "protein": 2.1,
        "carbs": 2.1,
        "fat": 243.3,
        "fiber": 0,
        "sugar": 2.1
      },
      {
        "name": "150 g Zucker",
        "amountGrams": 150,
        "calories": 581,
        "protein": 0,
        "carbs": 150,
        "fat": 0,
        "fiber": 0,
        "sugar": 150
      },
      {
        "name": "1 Pck. Zitronenschale",
        "amountGrams": 250,
        "calories": 73,
        "protein": 2.8,
        "carbs": 23.3,
        "fat": 0.8,
        "fiber": 7,
        "sugar": 6.3
      },
      {
        "name": "110 ml Zitronensaft, frisch gepresst",
        "amountGrams": 110,
        "calories": 32,
        "protein": 1.2,
        "carbs": 10.2,
        "fat": 0.3,
        "fiber": 3.1,
        "sugar": 2.8
      },
      {
        "name": "4 Becher Sahne",
        "amountGrams": 800,
        "calories": 2336,
        "protein": 19.2,
        "carbs": 25.6,
        "fat": 240,
        "fiber": 0,
        "sugar": 25.6
      },
      {
        "name": "einige Pistazien, ungesalzene, gehackt",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "etwas Zitronenmelisse",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      }
    ],
    "instructions": [
      "Eigelb mit Wasser und 60 g Zucker schaumig rühren. Vanillezucker mit Eiweiß und 65 g Zucker steif schlagen mit der Eigelbmasse vermischen und dann das Mehl, Backpulver und die Stärke unterheben. Die Masse in eine Springform geben und 25 min. bei 180 Grad Umluft backen.",
      "Für die Füllung die Gelatine auflösen und mit Buttermilch, Zucker, Zitronenschale- und Saft verrühren. Im Kühlschrank etwas fest werden lassen. In der Zwischenzeit 3 Becher Sahne schlagen und dann mit der leicht fest gewordenen Buttermilchmasse verrühren.",
      "Nun den Boden halbieren und wieder die Springform drumlegen. Die halbe Füllung auf eine Hälfte geben und die andere Hälfte des Bodens drauflegen. Nun die andere Hälfte der Füllung draufgeben und glatt streichen. 4 - 5 Stunden fest werden lassen, besser über Nacht.",
      "Nun kann man die Torte mit 1 Becher geschlagener Sahne, Pistazien und Melissenblättchen verzieren."
    ],
    "imageUrl": "recipes/18cd7f4d-22e7-4f14-9f4c-6841878e05a0.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 3233,
    "cookedWeight": 2910,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 243,
    "calories100g": 267,
    "protein100g": 3.4,
    "carbs100g": 21.7,
    "fat100g": 18.8,
    "fiber100g": 0.8,
    "sugar100g": 12,
    "createdAt": 1791626514029
  },
  {
    "name": "Zuppa Di Mare",
    "category": "meal",
    "ingredients": [
      {
        "name": "1 kg Kartoffel(n), festkochende in Scheiben geschnitten",
        "amountGrams": 1000,
        "calories": 1500,
        "protein": 40,
        "carbs": 200,
        "fat": 50,
        "fiber": 10,
        "sugar": 30
      },
      {
        "name": "1 ½ kg Fleischtomate(n) oder Flaschentomaten, in Scheiben geschnitten",
        "amountGrams": 55,
        "calories": 11,
        "protein": 0.6,
        "carbs": 2.2,
        "fat": 0.1,
        "fiber": 0.7,
        "sugar": 1.4
      },
      {
        "name": "4 Paprikaschote(n), (verschiedene Farben) in Streifen geschnitten",
        "amountGrams": 220,
        "calories": 68,
        "protein": 2.2,
        "carbs": 13.2,
        "fat": 0.7,
        "fiber": 4.6,
        "sugar": 9.2
      },
      {
        "name": "1 kg Zwiebel(n) (Gemüsezwiebeln) in Streifen geschnitten",
        "amountGrams": 1000,
        "calories": 400,
        "protein": 11,
        "carbs": 93,
        "fat": 1,
        "fiber": 17,
        "sugar": 42
      },
      {
        "name": "2 Pck. Meeresfrüchte, TK-Frutti-di-Mare (geht natürlich auch mit frischer Ware)",
        "amountGrams": 500,
        "calories": 750,
        "protein": 20,
        "carbs": 100,
        "fat": 25,
        "fiber": 5,
        "sugar": 15
      },
      {
        "name": "2 Tintenfisch(e) (Tuben), in Ringe geschnitten",
        "amountGrams": 200,
        "calories": 184,
        "protein": 32,
        "carbs": 6,
        "fat": 2.8,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Muschel(n), Krabben, Scampis, Riesengarnelen je nach Geschmack und Geldbeutel::))",
        "amountGrams": 100,
        "calories": 99,
        "protein": 24,
        "carbs": 0.2,
        "fat": 0.3,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Glas Wein, weiß",
        "amountGrams": 200,
        "calories": 300,
        "protein": 8,
        "carbs": 40,
        "fat": 10,
        "fiber": 2,
        "sugar": 6
      },
      {
        "name": "1 Glas Olivenöl",
        "amountGrams": 200,
        "calories": 1768,
        "protein": 0,
        "carbs": 0,
        "fat": 200,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "Salz und Pfeffer evtl. Chili's nach Geschmack",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "Petersilie",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Alle Zutaten nacheinander in einen großen Topf schichten bis alle Zutaten verbraucht sind - wichtig: mit einer Lage Tomaten anfangen! Die einzelnen Gemüselagen salzen und pfeffern.",
      "Zum Schluss 1 Glas Weißwein und 1 Glas Olivenöl dazu gießen.",
      "Einmal kurz aufkochen, dann auf ganz kleiner Hitze mindestens 2-3 Stunden vor sich hin köcheln lassen (1-2 Stunden länger schadet nix).",
      "Dieser rustikale Eintopf ist bei uns der Renner auf jeder Fete. Besonders lecker mit frischem Baguette und wer es scharf mag mit frisch gemahlenen getrockneten Chilischoten. Schmeckt am nächsten Tag noch besser.",
      "Übrigens ein absolutes Originalrezept von unserem alten Nachbarn aus Madeira."
    ],
    "imageUrl": "recipes/e277ff7c-9d85-41f3-bbed-51f64b9c2346.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#meal"
    ],
    "totalRawWeight": 3675,
    "cookedWeight": 3675,
    "servingName": "1 Portion (1/4)",
    "servingWeightGrams": 919,
    "calories100g": 142,
    "protein100g": 3.9,
    "carbs100g": 12.9,
    "fat100g": 8,
    "fiber100g": 1.1,
    "sugar100g": 2.9,
    "createdAt": 1791626514029
  },
  {
    "name": "Zwetschgendatschi Mit Butterstreuseln",
    "category": "bread",
    "ingredients": [
      {
        "name": "350 g Weizenmehl, Type 550",
        "amountGrams": 350,
        "calories": 1201,
        "protein": 36.1,
        "carbs": 248.5,
        "fat": 3.5,
        "fiber": 11.2,
        "sugar": 2.4
      },
      {
        "name": "60 g Zucker",
        "amountGrams": 60,
        "calories": 232,
        "protein": 0,
        "carbs": 60,
        "fat": 0,
        "fiber": 0,
        "sugar": 60
      },
      {
        "name": "1 Msp. Vanillemark, getrocknet, oder Vanillezucker",
        "amountGrams": 100,
        "calories": 390,
        "protein": 0,
        "carbs": 98,
        "fat": 0,
        "fiber": 0,
        "sugar": 98
      },
      {
        "name": "180 ml Milch, knapp, lauwarm",
        "amountGrams": 180,
        "calories": 115,
        "protein": 5.9,
        "carbs": 8.6,
        "fat": 6.5,
        "fiber": 0,
        "sugar": 8.6
      },
      {
        "name": "1 Ei(er)",
        "amountGrams": 55,
        "calories": 79,
        "protein": 6.9,
        "carbs": 0.4,
        "fat": 5.2,
        "fiber": 0,
        "sugar": 0.4
      },
      {
        "name": "30 g Hefe, frisch",
        "amountGrams": 30,
        "calories": 30,
        "protein": 1.5,
        "carbs": 6,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "1 Prise(n) Salz",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "60 g Butter, flüssig",
        "amountGrams": 60,
        "calories": 430,
        "protein": 0.4,
        "carbs": 0.4,
        "fat": 48.7,
        "fiber": 0,
        "sugar": 0.4
      },
      {
        "name": "etwas Zitronenschale, abgeriebene oder Finess",
        "amountGrams": 100,
        "calories": 29,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.3,
        "fiber": 2.8,
        "sugar": 2.5
      },
      {
        "name": "1500 g Zwetschgen, entsteint",
        "amountGrams": 1500,
        "calories": 690,
        "protein": 10.5,
        "carbs": 171,
        "fat": 4.5,
        "fiber": 21,
        "sugar": 148.5
      },
      {
        "name": "etwas Zimt, zum Bestäuben",
        "amountGrams": 100,
        "calories": 5,
        "protein": 0.2,
        "carbs": 0.5,
        "fat": 0.1,
        "fiber": 0.1,
        "sugar": 0.2
      },
      {
        "name": "300 g Mehl",
        "amountGrams": 300,
        "calories": 1029,
        "protein": 30.9,
        "carbs": 213,
        "fat": 3,
        "fiber": 9.6,
        "sugar": 2.1
      },
      {
        "name": "280 g Zucker",
        "amountGrams": 280,
        "calories": 1084,
        "protein": 0,
        "carbs": 280,
        "fat": 0,
        "fiber": 0,
        "sugar": 280
      },
      {
        "name": "1 EL Vanillezucker",
        "amountGrams": 15,
        "calories": 59,
        "protein": 0,
        "carbs": 14.7,
        "fat": 0,
        "fiber": 0,
        "sugar": 14.7
      },
      {
        "name": "1 TL Zimt",
        "amountGrams": 5,
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0
      },
      {
        "name": "200 g Butter, kalt, in Stücken",
        "amountGrams": 200,
        "calories": 1434,
        "protein": 1.4,
        "carbs": 1.4,
        "fat": 162.2,
        "fiber": 0,
        "sugar": 1.4
      },
      {
        "name": "Fett, für das Blech",
        "amountGrams": 100,
        "calories": 150,
        "protein": 4,
        "carbs": 20,
        "fat": 5,
        "fiber": 1,
        "sugar": 3
      }
    ],
    "instructions": [
      "Aus 3 EL Mehl, 1 TL Zucker, Hefe und der Hälfte der lauwarmen Milch in einer kleinen Schüssel einen Vorteig herstellen und zugedeckt an einem warmen Ort gehen lassen.",
      "In der Zwischenzeit, die Zwetschgen waschen, abtropfen und von den Stielen befreien und mit einem Obstentsteiner in Viertelspalten teilen, bzw. mit einem Messer halbieren und beiseitestellen.",
      "Die restlichen Zutaten für den Hefeteig in eine Rührschüssel geben und den Vorteig nach dem Gehen dazu geben und den Teig mit dem Knethaken solange aufschlagen, bis er leichte Blasen wirft, ebenfalls an einem warmen Ort zugedeckt solange gehen lassen, bis sich das Volumen verdoppelt hat.",
      "Den Backofen auf 190°C vorheizen.",
      "Für die Streusel Mehl mit der kalten, zerpflückten Butter, dem Zucker, Vanillezucker und Zimt rasch verkneten und zu Streuseln zerbröseln. Das Blech einfetten und den Hefeteig darauf auswellen. Die Zwetschgen fächerförmig darauf verteilen, mit etwas Zimt bestäuben und die Streusel gleichmäßig darauf verteilen.",
      "Bei 190°C ca. 35-40 Min. backen. Ergibt 20 Stücke!"
    ],
    "imageUrl": "recipes/7e260d1c-80a0-4128-bfda-76eaf00d8f47.jpg",
    "prepTimeMinutes": 30,
    "tags": [
      "#paprika",
      "#familienrezept",
      "#bread"
    ],
    "totalRawWeight": 3535,
    "cookedWeight": 3182,
    "servingName": "1 Stück (1/12)",
    "servingWeightGrams": 265,
    "calories100g": 219,
    "protein100g": 3.1,
    "carbs100g": 35.6,
    "fat100g": 7.5,
    "fiber100g": 1.4,
    "sugar100g": 19.6,
    "createdAt": 1791626514029
  }
];
