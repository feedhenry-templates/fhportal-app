define({
    renderChartFromData: function(data, destContainer, clickFunction){
        var userChart = this.templateChartPie;
        userChart.title.text = data.title;
        userChart.series = data.data;
        if (clickFunction){
            userChart.plotOptions.pie.point.events.click = clickFunction;    
        }
        
        // Create a global chart for destruction and reference, whatever.. I copied this from a previous project
        if (window.chart01){
            window.chart01.destroy();
        }
        console.log("Creating chart with data", userChart)
        window.chart01 = destContainer.find('div[name="statContainer"]').highcharts(userChart).highcharts();
    },

    templateChartPie: {
        "chart": {
             "renderTo": 'container',
             "spacingTop": 0,
             "type": "pie",
             "backgroundColor": 'transparent'
        },
        "title": {
             "text": false
        },
        "credits": {
             "enabled": false
        },
        "legend": {
          "enabled": true,
          "floating": true,
          "verticalAlign": 'bottom',
          "align":'right',
          "y":10,
          "borderColor": 'rgba(35,37,38,100)',
          "labelFormatter": function() { return this.name + ': ' + this.y; }
        },
        "plotOptions": {
            "pie": {
              "animation": {
                  "duration": 500,
                  "easing": "swing"
              },
              "center": ['50%', '50%'],
              "allowPointSelect": true,
              "cursor": 'pointer',
              "point": {
                "events": {}
              },
              "dataLabels": {
                  "enabled": false
              },
              "size":'95%',
              "showInLegend": true
            },
        },
        "series": false
    }
});