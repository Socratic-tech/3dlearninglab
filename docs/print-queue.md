# School print queue — quick start

One shared line for everything your school sends to the 3D printer. It works **without** the course: anyone at school
can use it, and the course feeds the same line when students upload an STL in a mission.

**Who can send:** anyone who signs in with a Google account on your school's email domain(s). Their verified Google
sign-in is their identity, so every request shows a name and email. Nobody can send as someone else, and people
outside your domains are turned away. No roster, class or Tinkercad account is needed.

## Set it up (teacher or printer person, about 5 minutes, once)
Use the same 3 steps as the course: [teacher-quickstart.md](teacher-quickstart.md) (make your copy and allow it, turn on
your app). You don't need a class to use the print queue, and the **School print queue** card with its link appears in the side panel as soon as step 2 is done.

Then, in the Sheet's side panel:
1. Under **Settings**, check the school email domain(s) are right (for example `district.org, students.district.org`).
   The queue refuses everyone if no domain is set.
2. Click **Copy print queue link** (under **School print queue**) and share it: staff email, the library page, a poster.

## Sending a print (everyone)
Open the link and sign in with your school Google account, then:
1. **Choose your design**: upload an `.stl`, `.obj` or `.3mf` file (10 MB max), or paste a link.
2. **Say what you need**: copies (1–10) and an optional note (color, size, when you need it).
3. **Send it.** The same page shows where it is in line, any note from the printer person, and a **Cancel** button
   until printing starts. Up to 5 open requests per person keeps the line fair.

## Running the queue (teacher or printer person)
Click **Open the print queue** on the side panel's **School print queue** card (no class needed; bookmark it). It lists
requests from the school link and from any classes, oldest first, and refreshes every minute. A class dashboard's
**Prints** tab shows the same list. Each request has
name, email, copies, the file or link, and the student's note. Move each along: **printing → printed**, or **redo**
with a note saying what to change. Notes (like "pick up at the front desk") show on the sender's page.

## Good to know
- **Turn it off:** uncheck **Anyone at school can send prints** under Settings (or set `PRINT_SUBMIT` to `FALSE` in the
  Config tab). Class students can still send prints from missions.
- **Where files go:** uploads are saved in a folder in the printer person's Drive, one subfolder per sender.
- **Privacy:** same as the course. Everything is in your own Google Sheet and Drive. See [privacy.md](privacy.md).
- **Limits (for now):** one queue per Sheet, one printer person's Sheet owns it, and rosters/progress tracking stay
  in the course.
