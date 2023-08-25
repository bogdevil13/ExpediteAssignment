import { LightningElement, track } from 'lwc';
import getSummaryYearsData from '@salesforce/apex/SummaryYearsData.getSummaryYearsData';
import getSummaryMonthsData from '@salesforce/apex/SummaryMonthsData.getSummaryMonthsData';
import getLineItemData from '@salesforce/apex/LineItemData.getLineItemData';
export default class ForecastTableRenderer extends LightningElement {

    // fetched data variables
    summaryYearsData = null;
    summaryMonthsData = null;
    lineItemData = null;
    
    headers = [
        "Product", // productItemName
        "Option", //na
        "Attribute", //na
        "Revenue Type", //revenueType
        "QTY", //qty
        "Unit Price",//unitPrice
        "Start Month",//startMonth
        "Months",//months
        "Revenue Recognition",//na
        "Commited",//committed
    ].map((data,index)=>{return {key: `h-${index}`, value: data}})

    @track renderTable = false;
    @track showMonthlySummary = false;

    toggleMonthlySummary(){
        this.showMonthlySummary = !this.showMonthlySummary;
    }

    connectedCallback() {
        try{
            let apexCalls = []
            apexCalls.push(getSummaryYearsData()
            .then(res=>{
                this.summaryYearsData = JSON.parse(res).responseData.yearsData;
            }))
            apexCalls.push(getSummaryMonthsData()
            .then(res=>{
                this.summaryMonthsData = JSON.parse(res).responseData;
            }))
            apexCalls.push(getLineItemData()
            .then(res=>{
                this.lineItemData = JSON.parse(res);
            }))
            Promise.all(apexCalls)
            .then(()=>{
                this.padMonthlySummaryLineItems()
                this.generateMonthsAndYearsHeader()
                this.generateDataRows()
                this.renderTable = true;
                // console.log('fetched data => ',JSON.stringify([this.summaryYearsData, this.summaryMonthsData, this.lineItemData]))
                // console.log('headers=>',JSON.stringify([this.monthsHeader,this.yearsHeader]))
                // console.log(JSON.stringify(this.dataRows))


            }).catch(err=>{throw new Error(err)})
        }
        catch(error){
            console.error('something went wrong => ', error)
        }
    }

    // rendered data
    dataRows = [];
    summaryRows = {
        paddingRows : [],
        monthlySummaryRows : [],
        yearlySummaryRows : []
    };
    generateDataRows(){
        try{

            this.dataRows = this.lineItemData.map(rec =>{
                let row = {
                    key: rec.productFLIId,
                    data : [],
                    monthlyData : this.summaryMonthsData.linesData.find(mRec => mRec.recordId == rec.productFLIId ).data.map((r,index)=>{return {
                                                                                                                                        key: `${rec.productFLIId}-m-${index}`,
                                                                                                                                        value: r}}),
                    annualData : this.summaryYearsData.map((yRec,index) =>{
                                                                            let amountRec = yRec.lineData.find(r=>r.recordId == rec.productFLIId)
                                                                            return {
                                                                            key: `${rec.productFLIId}-y-${index}`, 
                                                                            value : ( amountRec && amountRec.amount ) ? amountRec.amount : '-' }})
                }
                row.data.push(rec.productItemName);
                row.data.push('n/a'); // no key for options 
                row.data.push('n/a'); // no key for attributes
                row.data.push(rec.revenueType);
                row.data.push(rec.qty);
                row.data.push(rec.unitPrice);
                row.data.push(rec.startMonth);
                row.data.push(rec.months);
                row.data.push('n/a');
                row.data.push(rec.committed);
                row.data = row.data.map((r,index)=>{return {key: `${rec.productFLIId}-data-${index}`, value: r}})
                return row
            })

            this.summaryRows.paddingRows = new Array(Object.keys(this.headers).length).fill('').map((r,index)=>{return {key: `summary-padding-${index}`, value: r}})
            this.summaryRows.monthlySummaryRows = this.summaryMonthsData.summaryAmount.map((r,index)=>{return {key: `summary-monthly-${index}`, value: r}})
            this.summaryRows.yearlySummaryRows = this.summaryYearsData.map((r,index)=>{
                                                                            return {
                                                                                key: `summary-yearly-${index}`, 
                                                                                value: r.summaryAmount }})
            console.log(JSON.stringify(this.summaryRows))
        }
        catch(err){
            console.error('something went wrong', err)
        }
    }

    monthsHeader = [];
    yearsHeader = [];
    generateMonthsAndYearsHeader() {
        try{
            // Months
            let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            let monthPointer = this.summaryMonthsData.startMonth;
            let len =  this.summaryMonthsData.summaryAmount.length;
            let year = this.summaryMonthsData.startYear

            for(let i=0;i<len;i++){
                this.monthsHeader.push({ key: `mh-${i}`,
                                        value: `${months[monthPointer]} ${year}`})
                monthPointer++
                if(months.length === monthPointer){
                    year++
                    monthPointer=0
                }
            }
            // Years
            this.yearsHeader = this.summaryYearsData.map((data,index)=>{return {key: `yh-${index}`, value: data.year}})
        }
        catch(err){
            console.error('something went wrong', err)
        }

    }
    
    padMonthlySummaryLineItems(){
        try{
            let minMonth = this.summaryMonthsData.startMonth;
            let maxMonth = this.summaryMonthsData.summaryAmount.length;
            this.summaryMonthsData.linesData.forEach(ld=>{
            if(ld.startMonth - minMonth){
                ld.data.splice(0,0,...new Array(ld.startMonth - minMonth).fill('-'))
            }
            if(ld.data.length < maxMonth){
                ld.data.splice(ld.data.length,0,...new Array(maxMonth - ld.data.length).fill('-'))
            }})
        }
        catch(err){
            console.error('something went wrong', err)
        }
    }

}