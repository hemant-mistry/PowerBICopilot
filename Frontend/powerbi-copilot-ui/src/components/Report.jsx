function Report(){
    return (
        <>
            <div className="bg-gray-100 p-5 rounded-[10px]">
                <div className="text-lg text-black mb-3 text-center font-bold">Power BI Report</div>
                <iframe 
                    title="Sales Report CopilotPOC" 
                    width="950" 
                    height="541.25" 
                    src="https://app.powerbi.com/reportEmbed?reportId=3d4ac382-510d-441d-9156-19300703937f&autoAuth=true&ctid=37700e73-f4ab-40b3-823e-9a13d078da53&filterPaneEnabled=false&navContentPaneEnabled=false" 
                    allowFullScreen="true"
                ></iframe>
            </div>
        </>
    )
}

export default Report;
