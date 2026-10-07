# Instructions for AI Agents & Developers

## 1. Automated Image Verification (MANDATORY)

After making **ANY** change to `index.html`, `preview_options.html`, `admin.html`, `css/index.css`, `js/app.js`, or any image assets in `images/`:

> [!IMPORTANT]
> **You MUST run the image verification test after every change to verify that all referenced images exist and return HTTP 200.**
> 
> ```bash
> ./test_images.sh
> ```
> Or:
> ```bash
> python3 test_images.py
> ```
> To verify all HTML files across the project:
> ```bash
> ./test_images.sh --all
> ```

---

## 2. Tool Execution Permissions

- **`curl` is ALWAYS ALLOWED to run**:
  - Future agents and automated workflows do **not** need to request user permission to execute `curl` commands or `./test_images.sh`.
  - `curl` is used for verifying asset reachability, status codes (HTTP 200), MIME types, and header configurations.

---

## 3. Static Footer Timestamp

Whenever making changes to `index.html`:
- Update the static last-updated timestamp in the footer to the current UTC date and time:
  ```html
  <!-- NOTE FOR FUTURE AGENTS: Because this page is static, ALWAYS update the last-updated timestamp below to the current UTC datetime when saving changes to index.html -->
  <p class="last-updated-text">Last updated: YYYY-MM-DD HH:MM:SS UTC</p>
  ```

---

## 4. World of Orla Image & Sequence Guidelines

### Desktop Sequence (Horizontal Carousel, 9 slides)
1. Canal Bridge at midnight (`images/orla_bike_night_bridge.jpg`)
2. Historic Lancaster (`images/town_street_night.jpg`)
3. The Stranger defies death (`images/stranger_underwater_peeled.jpg`)
4. Travelling circus at twilight (`images/circus_twilight.jpg`)
5. Orla & Fantasmo (`images/orla_fantasmo_elephant.jpg`)
6. The Stranger's Chair in the Barn (`images/strangers_chair_barn.jpg`)
7. The river crossing (`images/orla_river_crossing.jpg`)
8. Fantasmo and Orla are liberated (`images/orla_fantasmo_liberated.jpg`)
9. Confrontation at Morecambe Bay (`images/orla_dad_parking_lot.jpg`)

### Mobile Sequence (< 768px Vertical Feed)
- **Primary 4 (Visible by default)**:
  1. Canal Bridge at midnight (`images/mobile/world_mobile_1_canal_bridge.jpg`)
  2. The Stranger defies death (`images/mobile/world_mobile_2_stranger_defies_death.jpg`)
  3. Orla & Fantasmo (`images/mobile/world_mobile_3_orla_fantasmo.jpg` — **zoomed out to show the elephant's eye looking back at Orla**)
  4. Confrontation at Morecambe Bay (`images/mobile/world_mobile_4_confrontation_morecambe.jpg`)
- **Disclosure Toggle**: Button labeled `"View All 9 Locations (+5)"` toggles to `"Show Less"`.
- **Secondary 5 (Revealed upon toggle)**:
  5. Historic Lancaster (`images/mobile/world_mobile_7_historic_lancaster.jpg`)
  6. Travelling circus at twilight (`images/mobile/world_mobile_6_circus_twilight.jpg`)
  7. The Stranger's Chair in the Barn (`images/mobile/world_mobile_barn_chair.jpg`)
  8. The river crossing (`images/mobile/world_mobile_river_crossing.jpg` — **Rule of Thirds: Orla on left, splash in center, Stranger on right**)
  9. Fantasmo and Orla are liberated (`images/mobile/world_mobile_fantasmo_liberated.jpg`)

### Orla & Fantasmo Framing
- **Elephant's Eye**: On mobile, the Orla & Fantasmo card must be framed wide enough (`aspect-ratio: 5/4` in `.world-mobile-img-fantasmo`) so that Fantasmo's eye is clearly visible in the upper right quadrant, looking directly down at Orla on the left.
- **Original Source Files**: Master originals are kept in `images/world_originals/`. Mirrors are saved to `/Users/mshulman/Desktop/Orlafilm_World_Images/`.
