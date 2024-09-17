function Report(){
    return (
        <>
            <div className="bg-gray-100 p-5 rounded-[10px]">
                <div className="text-lg text-black mb-3 text-center font-bold">Power BI Report</div>
                <iframe 
                    title="Sales Report" 
                    width="950" 
                    height="541.25" 
                    src="https://app.powerbi.com/reportEmbed?reportId=64c9fd97-1325-450c-992f-211a72059955&autoAuth=true&ctid=e4d98dd2-9199-42e5-ba8b-da3e763ede2e&filterPaneEnabled=false&navContentPaneEnabled=false" 
                    allowFullScreen="true"
                ></iframe>
            </div>
        </>
    )
}

export default Report;
