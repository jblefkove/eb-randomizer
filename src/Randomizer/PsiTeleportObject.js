/* eslint import/no-webpack-loader-syntax: off */
import { TableObject } from 'randomtools-js';
import tableText from '!array-loader!./tables/psi_teleport_table.txt';
import ebutils from './ebutils.js';
import MapEventObject from './MapEventObject.js';
import MapSpriteObject from './MapSpriteObject.js';
import TPTObject from './TPTObject.js';
import Script from './Script.js';
import ItemObject from './ItemObject.js';

class PsiTeleportObject extends TableObject {
    static shouldRandomize() {
        return this.context.specs.flags.k || this.context.specs.flags.o; // Keysanity or Open
    }

    static serialize() {
        return this._results.map(resultPair => {
            return {
                item: ItemObject.get(resultPair[1]).name,
                destination: ItemObject.get(resultPair[0]).name,
            }
        })
    }

    get name() {
        return ebutils.listToText(this.data.name_text);
    }

    set name(str) {
        this.data.name_text = ebutils.textToList(str, this.data.name_text.length);
    }

    mutate() {
        if(this.name.length > 0) {
            this.data.flag = 0xd9; // Pyramid entrance ready
        }
        if(this.index === 13) {
            this.name = "South Winters";
            this.data.x = 26;
            this.data.y = 595;
            this.data.flag = 0xd9;
        }
        if(this.index === 15) {
            this.name = "North Onett";
            this.data.x = 322;
            this.data.y = 54;
            this.data.flag = 0xd9;
        }
    }

    static containsAll (array, other) {
        for (var i = 0; i < other.length; i++) {
            if (array.indexOf(other[i]) === -1) {
                return false;
            }
        }
        return true;
    }

    static checkLegalKeysanity() {
        if(!this._results) return false;

        const FRANKLIN_BADGE = 0x01;
        const JAR_OF_FLY_HONEY = 0x69;
        const BACKSTAGE_PASS = 0x7d;
        const YOGURT_DISPENSER = 0x8b;
        const FOR_SALE_SIGN = 0xa3;
        const SHYNESS_BOOK = 0xa4;
        const KING_BANANA = 0xa6;
        const KEY_TO_THE_SHACK = 0xaa;
        const KEY_TO_THE_CABIN = 0xab;
        const HAWK_EYE = 0xaf;
        const BICYCLE = 0xb0;
        const WAD_OF_BILLS = 0xb4;
        const RECEIVER_PHONE = 0xb5;
        const DIAMOND = 0xb6;
        const SIGNED_BANANA = 0xb7;
        const PENCIL_ERASER = 0xb8;
        const HIEROGLYPH_COPY = 0xb9;
        const CONTACT_LENS = 0xbb;
        const KEY_TO_THE_TOWER = 0xc0;
        const METEORITE_PIECE = 0xc1;
        const SOUND_STONE = 0xc4;
        const TOWN_MAP = 0xca;
        const SUPORMA = 0xcc;
        const INSIGNIFICANT_ITEM = 0xce;
        const ERASER_ERASER = 0xd2;
        const TENDAKRAUT = 0xd3;
        const CARROT_KEY = 0xfd;

        // JAR_OF_FLY_HONEY and METEORITE_PIECE are excluded
        const LOCATIONS =
          [
            FRANKLIN_BADGE,
            BACKSTAGE_PASS,
            YOGURT_DISPENSER,
            FOR_SALE_SIGN,
            SHYNESS_BOOK,
            KING_BANANA,
            KEY_TO_THE_SHACK,
            KEY_TO_THE_CABIN,
            HAWK_EYE,
            BICYCLE,
            WAD_OF_BILLS,
            RECEIVER_PHONE,
            DIAMOND,
            SIGNED_BANANA,
            PENCIL_ERASER,
            HIEROGLYPH_COPY,
            CONTACT_LENS,
            KEY_TO_THE_TOWER,
            SOUND_STONE,
            TOWN_MAP,
            SUPORMA,
            INSIGNIFICANT_ITEM,
            ERASER_ERASER,
            TENDAKRAUT,
            CARROT_KEY,
          ];

        const REQUIRED_ITEMS =
          [
            KEY_TO_THE_SHACK,
            PENCIL_ERASER,
            JAR_OF_FLY_HONEY,
            SIGNED_BANANA,
            CARROT_KEY,
            SHYNESS_BOOK,
          ];

        const LOCATION_REQUIREMENTS =
          {
            [FRANKLIN_BADGE] : [PENCIL_ERASER],
            [KEY_TO_THE_CABIN] : [PENCIL_ERASER, FRANKLIN_BADGE],
            [WAD_OF_BILLS] : [PENCIL_ERASER, FRANKLIN_BADGE, KEY_TO_THE_CABIN],
            [BACKSTAGE_PASS] : [PENCIL_ERASER, FRANKLIN_BADGE, KEY_TO_THE_CABIN],
            [SIGNED_BANANA] : [DIAMOND],
            [KING_BANANA] : [DIAMOND],
            [YOGURT_DISPENSER] : [DIAMOND, KING_BANANA, PENCIL_ERASER],
            [CARROT_KEY] : [SIGNED_BANANA],
            [SHYNESS_BOOK] : [ERASER_ERASER],
            [TENDAKRAUT] : [SHYNESS_BOOK],
          };

        var openPositions = [];
        for (var i = 0; i < LOCATIONS.length; i++) {
          const pos = LOCATIONS[i];
          if (!LOCATION_REQUIREMENTS[pos]) {
            openPositions.push(pos);
          }
        }

        var openItems = [];
        for (var i = 0; i < this._results.length; i++) {
          const item = this._results[i][1];
          const dest = this._results[i][0];
          if (openPositions.includes(dest)) {
            openItems.push(item);
          }
        }

        while (true) {
          if (this.containsAll(openItems, REQUIRED_ITEMS)) {
            return true;
          }

          var changed = false;

          // try to open other items
          for (var i = 0; i < this._results.length; i++) {
            const item = this._results[i][1];
            const dest = this._results[i][0];
            if (openItems.indexOf(item) !== -1) {
              continue;
            }

            if (this.containsAll(openItems, LOCATION_REQUIREMENTS[dest])) {
              openItems.push(item);
              openPositions.push(dest);
              changed = true;
            }
          }

          if (!changed) {
            console.log("softlocked!");
            return false;
          }
      }
    }

    static intershuffle() {
        if(!this.context.specs.flags.k) return;
        this.classReseed("inter");

        const keyItemsIndex = [
            0x01,   // Franklin badge
            //0x69, // Jar of Fly Honey - Chest handled differently, at 0x7dacb.
            0x7d,   // Backstage pass
            0x8b,   // Yogurt dispenser
            0xa3,   // For sale sign
            0xa4,   // Shyness book
            0xa6,   // King banana
            0xaa,   // Key to the shack
            0xab,   // Key to the cabin
            0xaf,   // Hawk eye
            0xb0,   // Bicycle
            0xb4,   // Wad of bills
            0xb5,   // Receiver phone
            0xb6,   // Diamond
            0xb7,   // Signed banana
            0xb8,   // Pencil eraser
            0xb9,   // Hieroglyph copy
            0xbb,   // Contact lens
            0xc0,   // Key to the tower
            0xc4,   // Sound Stone
            0xca,   // Town map
            0xcc,   // Suporma
            0xce,   // Insignificant item
            0xd2,   // Eraser eraser
            0xd3,   // Tendakraut
            0xfd,   // Carrot key
        ];

        const sourceItems = keyItemsIndex.slice();
        const newItems = keyItemsIndex.slice();
        newItems[newItems.indexOf(0xd3)] = 0x69; // Tendakraut => Jar of Fly Honey
        newItems[newItems.indexOf(0xcc)] = 0xc1; // Suporma => Meteorite piece

        // Ensure pointers are all in Script.every cache.
        // TODO: Cache this when final key items list decided.
        MapEventObject.every.forEach(o => o.script);
        MapSpriteObject.every.forEach(o => o.script);
        Script.getByPointer(0x9d95e); // Tendakraut

        while(!this.checkLegalKeysanity()) {
            this.context.random.shuffle(newItems);
            PsiTeleportObject._results = sourceItems.map((si, i) => [si, newItems[i]]);
        }

        // Cache allSources
        PsiTeleportObject._results.forEach(result => {
            const [sourceItem, _] = result.map(index => ItemObject.get(index)); // eslint-disable-line
            sourceItem.allSources; // eslint-disable-line
        });

        PsiTeleportObject._results.forEach(result => {
            const [sourceItem, newItem] = result.map(index => ItemObject.get(index));
            sourceItem.allSources.forEach(source => {
                source.replaceItem(sourceItem, newItem);
                source.mutated = true;
            });
        });
    }

    static fullCleanup() {
        if(!this.shouldRandomize()) {
            super.fullCleanup();
            return;
        }
        // Following cleanups are valid for both Keysanity and Open mode

        // Patch Bubble Monkey rope interaction
        const bubbleMonkeyRope = Script.getByPointer(0x97f72);
        bubbleMonkeyRope.lines.splice(1, bubbleMonkeyRope.lines.length - 3);
        bubbleMonkeyRope.writeScript();

        // Patch intro script to set all teleports available immediately, and
        // put all necessary items in Tracy's inventory if Open mode
        const intro = Script.getByPointer(0x5e70b);
        let patchLines = intro.lines.slice(0,2);
        patchLines.push(
            [0x04, 0xd9, 0x00], // Enable Pyramid entrance and all teleports
            [0x04, 0x8c, 0x00], // Enable Venus giving item
        );
        if(this.context.specs.flags.o) {
            const openItemsIndex = [
                0x01,   // Franklin badge
                0x69,   // Jar of Fly Honey
                0x7d,   // Backstage pass
                0xa4,   // Shyness book
                0xa6,   // King banana
                0xaa,   // Key to the shack
                0xaf,   // Hawk eye
                0xb4,   // Wad of bills
                0xb6,   // Diamond
                0xb7,   // Signed banana
                0xb8,   // Pencil eraser
                0xc0,   // Key to the tower
                0xc1,   // Meteorite piece
                0xd2,   // Eraser eraser
                0xfd,   // Carrot key
            ];
            patchLines.push(...openItemsIndex.map(i => [0x1d, 0x18, i]));
        }

        patchLines.push([0x02, ]);
        let patch = Script.writeNewScript(patchLines);
        intro.lines = intro.lines.slice(2);
        intro.lines.unshift([0x00]);
        intro.lines.unshift(ebutils.ccodeCallAddress(patch.pointer));
        intro.writeScript();

        // Patch Montague to always show up
        const montague = TPTObject.get(0x2f8);
        console.assert(montague.data.address === 0xc60349);
        montague.data.flag = 0;
        montague.data.flag_appear = 0;

        // Patch Mr Spoon to request autograph even after he's received it
        const spoon = TPTObject.get(0x38d);
        //assert spoon.data.address == 0xc826bc - could be changed in Dialog shuffle
        spoon.data.address = 0xc82468;

        // Patch Bubble Monkey to appear at north shore as soon as he runs off with his gal
        const monkey = Script.getByPointer(0x882bd);
        patchLines = monkey.lines.slice(0,2);
        patchLines.push(
            [0x04, 0x76, 0x02], // Enable Monkey at north shore
            [0x02, ]);
        patch = Script.writeNewScript(patchLines);
        console.assert(patch.length === 9);
        monkey.lines = monkey.lines.slice(2);
        monkey.lines.unshift(ebutils.ccodeCallAddress(patch.pointer));
        monkey.writeScript();

        // Patch Dr Andonuts to recognize Ness isn't Jeff
        const andonuts = Script.getByPointer(0x6b18d);
        patchLines = andonuts.lines.slice(0,2);
        patchLines.push( // check the normal flags first
            [0x19, 0x10, 0x01], // check character in slot 1
            [0x0b, 0x03], // is it Jeff?
            [0x1b, 0x03, ...ebutils.ccodeAddress(0x6b18d)], // go to normal andonuts text
            ebutils.ccodeGotoAddress(0x6b56e), // go to generic text for Ness
            [0x02, ]);
        patch = Script.writeNewScript(patchLines);
        const andonutsTpt = TPTObject.get(0x267);
        console.assert(andonutsTpt.data.address === 0xc6b18d);
        andonutsTpt.data.address = ebutils.fileToEbPointer(patch.pointer);

        super.fullCleanup();
    }
}

PsiTeleportObject.tableSpecs = {
    text: tableText,
    count: 16,
    pointer: 0x157880,
};

PsiTeleportObject._displayName = "psi teleport";
export default PsiTeleportObject;