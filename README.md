# WikiForge

---

- Autori: Juraj Štern-Vukotić (0303106940)
- [Fakultet informatike u Puli](https://fipu.unipu.hr/)
- [Kolegij: Programsko inženjerstvo](ntankovic.unipu.hr/pi)
- [Mentor: doc. dr. sc. Nikola Tanković](ntankovic.unipu.hr)

---

## About

The purpose of WikiForge is to let users create their own custom wikis, be it for internal documentation, business purposes, worldbuilding, or just personal knowledge bases.
However, it is not just a place to store information, but also link, share, and give/recieve feedback on it, while hopefully making connections along the way.

---

## Hrvatski

Wikiforge je rješenje za problem agregiranja i povezivanja tekstualnih informacija, te njihovog dijeljenja.
Radi na sljedeći način: Prvo morate napraviti račun, potvrditi e-mail adresu te nakon toga imate pristup svim funkcionalnostima.
Zatim možete napisati neke stvari o sebi koje će vidjeti vaši prijatelji, te promijeniti ime, zaporku, izbrisati račun ili se odjaviti.
Ako imate pitanja, možete ih postaviti u support, te ako je vaše pitanje relevantno, admin će ga odgovoriti, a pitanje i odgovor će biti javno vidljivi.
Neke novosti o Wikiforgeu mogu se vidjeti na Home stranici, a admin ih može uređivati, brisati i postavljati.
Kada ste spremni napraviti vaš Wiki, kliknete na Wikis, upišete ime i kreirate.
Kada kliknete na vaš novo kreirani Wiki, možete pisati komentare ili stvoriti nove članke.
Članci se pišu u markdown formatu te, kada kliknete render, članak se renderira.
Možete povezati članke tako da napišete naslov drugog članka ovako [[Članak2]].
Pod social možete dodati prijatelje, dopisivati se s njima te im dati pristup vašem Wikiju.
Viewer može samo čitati članke, Commenter može čitati i pisati komentare, a Editor može mijenjati i pisati nove članke, čitati i komentirati.

---

## Upute

- Potrebno u .env varijablu staviti konfiguraciju vašeg firebasea
- Potrebno je samo `npm run serve` te ići na localhost koji vam javi

---

## Rules za firestore ukoliko želite klonirati projekt

```
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection rules
    match /users/{userId} {


      // Allow users to create their own profiles (even if email not verified)
      allow create: if request.auth != null && request.auth.uid == userId;

      // Allow users to read and write their own profiles (only if verified)
      allow read, write: if request.auth != null &&
        request.auth.token.email_verified == true &&
        request.auth.uid == userId;

      // Allow verified authenticated users to read other profiles for search purposes
      allow read: if request.auth != null && request.auth.token.email_verified == true;

      // Allow authenticated users to send friend requests by updating another user's 'friendRequests' array
      allow update: if request.auth != null &&
        request.resource.data.friendRequests.size() == resource.data.friendRequests.size() + 1 &&
        !(request.auth.uid in resource.data.friendRequests); // Ensure the request is not already in the array

      // Allow authenticated users to accept friend requests by updating their own 'friends' and 'friendRequests' fields
      allow update: if request.auth != null && request.auth.uid == userId && (
        (request.resource.data.friends.size() == resource.data.friends.size() + 1 ||
         request.resource.data.friendRequests.size() == resource.data.friendRequests.size() - 1)
      );

      // Allow users to update another user's 'friends' array when accepting a friend request
      allow update: if request.auth != null && request.auth.uid != userId &&
        request.resource.data.friends.size() == resource.data.friends.size() + 1 &&
        request.auth.uid in request.resource.data.friends;

      // Allow authenticated users to remove themselves from another user's friends array
      allow update: if request.auth != null && request.auth.uid != userId &&
        request.auth.uid in resource.data.friends &&
        !(request.auth.uid in request.resource.data.friends); // Ensure the user is removing themselves
          allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true; // Allow only admins to update users

    }

    // Support questions collection rules
    match /supportQuestions/{questionId} {

      // Allow anyone to read answered questions
      allow read: if resource.data.answered == true;

      // Allow authenticated users with verified emails to create new questions
      allow create: if request.auth != null && request.auth.token.email_verified == true;

      // Allow only admin users to read, update, or delete unanswered questions
      allow read, update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Wikiforge News collection rules
    match /wikiforgeNews/{newsId} {

      // Allow anyone to read the news
      allow read: if true;

      // Allow admins to create, update, and delete news
      allow create, update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Wikis collection rules
    match /wikis/{wikiId} {
      allow read: if true; // Anyone can read wikis

    // Only owners and editors can update or delete wikis
    allow update, delete: if request.auth != null &&
      (resource.data.permissions[request.auth.uid] == "owner" || resource.data.permissions[request.auth.uid] == "editor");

    // Only authenticated users with verified emails can create wikis
      allow create: if request.auth != null && request.auth.token.email_verified == true;
    }

    // Articles collection rules
    match /articles/{articleId} {
    // Allow reading for all users (rendered mode)
    allow read: if true;

    // Only owners and editors of the parent wiki can update or delete articles
    allow update, delete: if request.auth != null &&
      exists(/databases/$(database)/documents/wikis/$(resource.data.wikiId)) &&
      (get(/databases/$(database)/documents/wikis/$(resource.data.wikiId)).data.permissions[request.auth.uid] == "owner" ||
      get(/databases/$(database)/documents/wikis/$(resource.data.wikiId)).data.permissions[request.auth.uid] == "editor");

    // Only authenticated users with verified emails can create articles
    allow create: if request.auth != null && request.auth.token.email_verified == true &&
      (get(/databases/$(database)/documents/wikis/$(request.resource.data.wikiId)).data.permissions[request.auth.uid] == "editor" ||
      get(/databases/$(database)/documents/wikis/$(request.resource.data.wikiId)).data.permissions[request.auth.uid] == "owner");
    }

    // Comments collection rules
    match /comments/{commentId} {
    // Viewers can read, Commenters and Editors can create comments
    allow read: if request.auth != null &&
      exists(/databases/$(database)/documents/wikis/$(resource.data.wikiId)) &&
      (get(/databases/$(database)/documents/wikis/$(resource.data.wikiId)).data.permissions[request.auth.uid] in ["viewer", "commenter", "editor", "owner"]);

    // Allow only commenters and editors to create comments
    allow create: if request.auth != null &&
      exists(/databases/$(database)/documents/wikis/$(request.resource.data.wikiId)) &&
      (get(/databases/$(database)/documents/wikis/$(request.resource.data.wikiId)).data.permissions[request.auth.uid] in ["commenter", "editor", "owner"]);

    // Only the comment owner can update/delete their own comments
    allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }


    match /chats/{chatId} {

    // Allow users to read messages if they are part of the chat (participants array)
    allow read: if request.auth != null && request.auth.token.email_verified == true && request.auth.uid in resource.data.participants;

    // Allow users to write messages if they are part of the chat (participants array)
    allow write: if request.auth != null && request.auth.token.email_verified == true && request.auth.uid in request.resource.data.participants;
    }

  }
}
```
