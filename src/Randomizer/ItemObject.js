/* eslint import/no-webpack-loader-syntax: off */
import { TableObject } from 'randomtools-js';
import tableText from '!array-loader!./tables/item_table.txt';
import ebutils from './ebutils.js';
import Script from './Script.js';
import MapSpriteObject from './MapSpriteObject.js';
import ShopObject from './ShopObject.js';

class ItemObject extends TableObject {
    get name() {
        return ebutils.listToText(this.data.name_text);
    }
    set name(str) {
        this.data.name_text = ebutils.textToList(str, this.data.name_text.length);
    }

    get isBuyable() {
        if(this._isBuyable !== undefined) return this._isBuyable;
        this._isBuyable = ShopObject.every.some(s => s.oldData.item_ids.includes(this.index));
        return this.isBuyable;
    }

    get isEquipment() {
        return [0x10, 0x11, 0x14, 0x18, 0x1c].includes(this.data.item_type);
    }

    get isSellable() {
        return this.oldData.price > 0;
    }

    get isKeyItem() {
        return ([0, 0x34, 0x35, 0x38, 0x3a, 0x3b].includes(this.data.item_type) && !this.isFixedItem &&
            !(this.isBuyable || this.isSellable));
    }

    get isFixedItem() {
        if(this._isFixedItem !== undefined) return this._isFixedItem;
        this._isFixedItem = this.constructor.every.some(s => s.isBroken && s.oldData.extra_power === this.index);
        return this.isFixedItem;
    }

    get isCondiment() {
        return this.data.item_type === 0x28;
    }

    get isBroken() {
        return this.data.item_type === 0x8;
    }

    get isWeapon() {
        return [16, 17].includes(this.data.item_type);
    }

    get isArmor() {
        return [20, 24, 28].includes(this.data.item_type);
    }

    get rank() {
        if(this._rank !== undefined) return this._rank;
        this._rank = this.computeRank();
        return this.rank;
    }

    computeRank() {
        if(this.index === 0) {
            return -1; //  'Null' item has a cost so will get incorrectly ranked
        }

        if(this.isKeyItem) {
            if(this.context.specs.flags.a && !this.getBit("nogive")) {
                return 1000001;
            }
            return -1;
        }

        if(this.isBroken) {
            return Math.ceil(this.constructor.get(this.oldData.extra_power).rank * 3 / 4);
        }

        if(!this.isBuyable && !this.isSellable && this.isWeapon) {
            return (this.oldData.strength + (this.oldData.extra_power_increase * 3)) * 40;
        }

        if(!this.isBuyable && !this.isSellable && this.isArmor) {
            return (this.oldData.strength + (this.oldData.extra_power_increase * 3)) * 30;
        }

        if(this.isFixedItem) {
            return this.index * 20;
        }

        if(!this.isBuyable && !this.isSellable) {
            return 1000000;
        }

        return this.oldData.price;
    }

    get limitOne() {
        if(this.getBit("one_use")) {
            return false;
        }
        if(this.data.price === 0 || this.getBit("nogive")) {
            return true;
        }

        if(this.data.equipable & 0xF) {
            const equipnum = ["ness", "paula", "jeff", "poo"].map(c => this.getBit(c)).reduce((a, b) => a + (b ? 1 : 0), 0);
            console.assert(equipnum > 0);
            return equipnum === 1;
        }
        return false;
    }

    get scriptSources() {
        return Script.every.filter(s => s.itemsGiven.includes(this));
    }

    get chestSources() {
        return MapSpriteObject.every.filter(t => t.isChest && this === t.chestContents);
    }

    get allSources() {
        return this.scriptSources.concat(this.chestSources);
    }

    cleanup() {
        const ignoreCleanup = [177, 197]; // ATM Card, Exit mouse
        if(ignoreCleanup.includes(this.index)) {
            return;
        }
        if(this.context.specs.flags.a && !(this.isSellable || this.getBit("nogive"))) {
            this.data.price = Math.max(this.data.price, 2);
        }
        if(this.context.specs.flags.a && this.index === 0xb3) { //Auto-StarMaster
            this.name = "Auto-StarMaster";
            this.setBit("one_use", true);

            const omegaGrantLines = [
                [0x1f, 0x71, 0x04, 0x03],
                [0x04, 0xf2, 0x03],
                [0x02,],
            ];
            const omegaGrant = Script.writeNewScript(omegaGrantLines);

            const checkGotoOmegaGrant = [0x06, 0xf1, 0x03];
            checkGotoOmegaGrant.push(...ebutils.ccodeAddress(omegaGrant.pointer));
            const nextGrantLines = [
                [0x01],
                checkGotoOmegaGrant,
                [0x1f, 0x71, 0x04, 0x02],
                [0x04, 0xf1, 0x03],
                [0x02,],
            ];
            const nextGrant = Script.writeNewScript(nextGrantLines);

            // Replace action in Master Barf fight with nextGrant call
            this.context.rom.set(ebutils.ccodeCallAddress(nextGrant.pointer), 0x2f743b);

            const omegaScriptLines = [
                ebutils.encodeText("<OMEGA>!"),
                [0x13,],
                [0x02,],
            ];
            const omegaScript = Script.writeNewScript(omegaScriptLines);

            const checkGotoOmegaScript = [0x06, 0xf2, 0x03];
            checkGotoOmegaScript.push(...ebutils.ccodeAddress(omegaScript.pointer));
            const mainScript = Script.getByPointer(0x6fed6);
            mainScript.lines = [
                [0x01],
                [0x1f, 0x02, 0x63],
                ebutils.ccodeCallAddress(nextGrant.pointer),
                [0x04, 0xf1, 0x03],
                [0x1f, 0x71, 0x04, 0x02],
                ebutils.encodeText("@"),
                [0x1c, 0x02, 0x04],
                ebutils.encodeText(" realized the power of Starstorm "),
                checkGotoOmegaScript,
                ebutils.encodeText("<ALPHA>!"),
                [0x13,],
                [0x02,],
            ];
            mainScript.writeScript();
            
            const helpScript = Script.getByPointer(0x556c1);
            helpScript.lines = [
                [0x01],
                ebutils.encodeText("@Realizes the next level of PSI Starstorm."),
                [0x13,],
                [0x02,],
            ];
            helpScript.writeScript();

        }
    }
}

ItemObject.tableSpecs = {
    text: tableText,
    count: 254,
    pointer: 0x155000,
};

ItemObject._displayName = "item";
export default ItemObject;