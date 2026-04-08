function BaseItem(name, category){
    this.id = crypto.randomUUID();
    this.name = name;
    this.category = category;

    this.CompareName = function(lookupName){
        if(lookupName.toLowerCase() === this.name.toLowerCase()){
            return this;
        }
        else{
            return false;
        }
    }
}

export default BaseItem;