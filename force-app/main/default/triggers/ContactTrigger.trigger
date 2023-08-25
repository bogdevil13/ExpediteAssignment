trigger ContactTrigger on Contact (after insert, after update) {
    if(Trigger.isAfter){
        if(Trigger.isInsert)
            ContactTriggerHandler.afterInsert(Trigger.New);
        if(Trigger.isUpdate)
            ContactTriggerHandler.afterUpdate(Trigger.New, Trigger.OldMap);
	}       
}