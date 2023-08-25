public class ContactTriggerHandler {
    public static final String BUSINESS_ACCOUNT_CONTACT_ROLE = 'Billing';
    public static void afterUpdate(List<Contact> newList, Map<Id, Contact> oldMap){
        creatAccountContactRoles(newList, oldMap);
    }
    public static void afterInsert(List<Contact> newList){
        creatAccountContactRoles(newList, null);
    }

    public static void creatAccountContactRoles(List<Contact> newList, Map<Id, Contact> oldMap){

        Map<Id, Id> accountContactMap = new Map<Id, Id>();
        for(Contact con: newList){
            if( con.AccountId != null && !accountContactMap.containsKey(con.AccountId) && (
                    Trigger.isInsert || 
                    oldMap.get(con.Id).AccountId != con.AccountId)){
                accountContactMap.put(con.AccountId, con.Id);
            }
        }
        if(!accountContactMap.isEmpty()){
            List<AccountContactRole> insertRecords = new List<AccountContactRole>();
            for(Account acc: [SELECT Id, 
                                ( SELECT Id FROM AccountContactRoles where Role =:BUSINESS_ACCOUNT_CONTACT_ROLE LIMIT 1 )
                            FROM Account
                            where Id IN: accountContactMap.keySet() ]){
                if(acc.AccountContactRoles.isEmpty()){
                    insertRecords.add(new AccountContactRole(Role = BUSINESS_ACCOUNT_CONTACT_ROLE, 
                                                            AccountId = acc.Id,
                                                            ContactId = accountContactMap.get( acc.Id)));
                }
            }
            if(!insertRecords.isEmpty()){
                insert insertRecords;
            }
        }
    }
}