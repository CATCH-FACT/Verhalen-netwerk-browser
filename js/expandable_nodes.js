function NodeViewer(vm){

    this.init = function(){

        setLegendList();
        
        var pinging = [];
        var pinging_link = [];
        
        var w = 1200, //start dimensions
            h = 800,
            lw = 0, 
            lh = 0;

        var zoom = d3.behavior.zoom()
            .scale(50)
            .scaleExtent([-500, 10000])
            .on("zoom", zoomed);

        var force = d3.layout.force()
            .linkDistance(vm.node_params()["linkDistance"].value())
//            .linkStrength(vm.node_params()["linkStrength"].value())
            .distance(20)
            .charge(vm.node_params()["charge"].value())
            .gravity(vm.node_params()["gravity"].value())
            .friction(vm.node_params()["friction"].value())
            .theta(vm.node_params()["theta"].value())
            .size([w, h]);
//            .on("tick", tick);

        var svg = d3.select("body").append("svg")
//            .attr("viewBox", "0 0 " + w + " " + h) //scaling everything when window size changes
            .attr("width", w)
            .attr("height", h)
            .call(zoom);
            
        d3.select("svg")
            .on("dblclick.zoom", null)
            .on("click", null)
            .on("drag", null)
            .on( "mousedown", function() {
/*                if( !d3.event.ctrlKey) {
                    d3.selectAll( 'g.selected').classed( "selected", false);
                }

                var p = d3.mouse( this);

                svg.append( "rect")
                .attr({
                    rx      : 6,
                    ry      : 6,
                    class   : "selection",
                    x       : p[0],
                    y       : p[1],
                    width   : 0,
                    height  : 0
                })*/
            })
            .on( "mousemove", function() {
/*                var s = svg.select( "rect.selection");

                if( !s.empty()) {
                    var p = d3.mouse( this),
                        d = {
                            x       : parseInt( s.attr( "x"), 10),
                            y       : parseInt( s.attr( "y"), 10),
                            width   : parseInt( s.attr( "width"), 10),
                            height  : parseInt( s.attr( "height"), 10)
                        },
                        move = {
                            x : p[0] - d.x,
                            y : p[1] - d.y
                        }
                    ;

                    if( move.x < 1 || (move.x*2<d.width)) {
                        d.x = p[0];
                        d.width -= move.x;
                    } else {
                        d.width = move.x;       
                    }

                    if( move.y < 1 || (move.y*2<d.height)) {
                        d.y = p[1];
                        d.height -= move.y;
                    } else {
                        d.height = move.y;       
                    }

                    s.attr( d);

                        // deselect all temporary selected state objects
                    d3.selectAll( 'g.state.selection.selected').classed( "selected", false);

                    d3.selectAll( 'g.state >circle.inner').each( function( state_data, i) {
                        if( 
                            !d3.select( this).classed( "selected") && 
                                // inner circle inside selection frame
                            state_data.x-radius>=d.x && state_data.x+radius<=d.x+d.width && 
                            state_data.y-radius>=d.y && state_data.y+radius<=d.y+d.height
                        ) {

                            d3.select( this.parentNode)
                            .classed( "selection", true)
                            .classed( "selected", true);
                        }
                    });
                }*/
            })
            .on( "mouseup", function() {
                   // remove selection frame
                svg.selectAll( "rect.selection").remove();

                    // remove temporary selection marker class
                d3.selectAll( 'g.state.selection').classed( "selection", false);
            })
            .on( "mouseout", function() {
/*                if( d3.event.relatedTarget.tagName=='HTML') {
                        // remove selection frame
                    svg.selectAll( "rect.selection").remove();

                        // remove temporary selection marker class
                    d3.selectAll( 'g.state.selection').classed( "selection", false);
                }*/
            });
            

        var link = svg.append("g")
                      .attr("class", "links")
                      .selectAll(".link");
                        
        var node = svg.append("g")
                        .attr("class", "nodes")
                        .selectAll(".node");

        updateWindow();
        window.onresize = updateWindow;

        var pin_button = svg.selectAll(".pin_button");

        function updateWindow(){
            w = window.innerWidth || window.documentElement.clientWidth || window.getElementsByTagName('body')[0].clientWidth;
            h = window.innerHeight|| window.documentElement.clientHeight|| window.getElementsByTagName('body')[0].clientHeight;
            svg.attr("width", w).attr("height", h);
        }

        function zoomed() {
            vm.node_params()["gravity"].value(Math.min((d3.event.scale + 600)/4000), 0.2);
            vm.node_params()["charge"].value(-(d3.event.scale));
            vm.node_params.valueHasMutated();
        }

        function ping_link(){
            if (pinging_link.length > 0){
                var link_ping = svg.selectAll("line.ping").data(pinging_link)
                    .enter().append("svg:line", "g")
                    .classed("ping", true)
                    .attr("x1", function(d) { return Math.max(0, Math.min(w, d.source.x)); })
                    .attr("y1", function(d) { return Math.max(20, Math.min(h, d.source.y)); })
                    .attr("x2", function(d) { return Math.max(0, Math.min(w, d.target.x)); })
                    .attr("y2", function(d) { return Math.max(20, Math.min(h, d.target.y)); })
                    .style("stroke-width", stroke_width);
                link_ping.transition().duration(600)
                    .ease("quad-out")
                    .style("stroke-width", 40)
                    .style("stroke-opacity", 0.1)
                    .remove();
                setTimeout(ping_link, 1600);
            }
        }

        function ping() {
            if (pinging.length > 0) {
        		var pings = svg.selectAll("circle.ping").data(pinging)
        			.enter().append("svg:circle", "g")
        			.classed("ping", true)
        			.attr("cx", function(d) { return d.x; })
        			.attr("cy", function(d) { return d.y; })
        			.attr("r", 15);
        		pings.transition().duration(600)
        			.ease("quad-out")
        			.attr("r", 60)
        			.style("stroke-opacity", 0.1)
        			.style("stroke-width", 0.5)
        			.remove();
        		setTimeout(ping, 1600);
        	}
	    }

        function stroke_width(d){
            if (vm.links_same_size()){
                return 5;
            }
            else {
                return Math.max(d.score, 1.0);
            }
        }
    
        function node_size(d){
            if (vm.nodes_same_size()){
                return 14;
            }
            else {
                return Math.min(Math.max(Math.sqrt(d.text_length * 3), 15), vm.max_nodes_size()) || 12;
            }
        }
        
        function node_text(d) { 
            if (vm.title_in_node()){
                return d.identifier + (d.title ? ": " + d.title : ""); 
            }
            else{
                return "";
            }
        }

        function stroke_color(d){
            if (vm.link_colors_by_score_strength()){
                color_return = d3.hsl(d.score, d.score / 10, (1 - d.score / 40) - 0.2).toString();
            }
            else {
                color_return = "#9ecae1";
            }
            return color_return;
        }

        function update() {

            var graph = vm.network_graph();

            // Restart the force layout.
            force.nodes(graph.nodes)
                .links(graph.links)
                .start();

            force.linkStrength(function(link) {
                    return link.score / 15;
                });

            force_drag = force.drag().on("dragstart", dragstart); //interferes with doubleclick!! AARGGH

            // Update links.
            link = link.data(graph.links);

            link.exit().transition().remove();

            link.transition()
/*                .attr("opacity", function(d) { 
                    return Math.max(d.score, 1.0) * 0.2;
                })*/
                .attr("stroke-width", stroke_width)
                .attr("stroke", stroke_color);

            link.enter()
                .append("line", ".node")
                .attr("class", "link")
/*                .attr("opacity", function(d) { 
                    return Math.max(d.score, 1.0) * 0.15;
                })*/
                .attr("stroke-width", stroke_width)
                .attr("stroke", stroke_color);
                
            link.on("mouseover", function(d){
                    d3.select(this)
                        .transition()
                        .ease("elastic")
                        .attr("opacity", 1)
                        .attr("stroke", "orange")
                        .attr("stroke-width", function(d) { 
                            return Math.max(d.score, 5.0) * 2;
                        });
                        
                })
                .on("mouseout", function(d){
                    d3.select(this)
                        .transition()
                        .ease("elastic")
/*                        .attr("opacity", function(d) { 
                            return Math.max(d.score, 1.0) * 0.2;
                        })*/
                        .attr("stroke-width", stroke_width)
                        .attr("stroke", stroke_color);
                })
                .on("click", left_click_link)
                .on("dblclick", remove_link_click);
                    
            // Update nodes.
            node = node.data(graph.nodes);

            node.exit()
                .transition()
                .delay(400)
                .duration(1000)
                .select("circle")
                .attr("r", 1)
                .remove();
            
            node.exit()
                .transition()
                .delay(1000)
                .remove();

            var nodeEnter = node.enter().append("g")
                .attr("class", function(d) {
                    return (d.subgenre ? "node " + d.subgenre[0].replace(" ", "_") : "node other");
                }) //determine color based on genre
                .on("dblclick", collect_neighbors)
                .on("click", left_click_node_wait)
//                .on("contextmenu", right_click_node)
                .on("contextmenu", dragstop)
                .on("dblclick", dragstop)
                .call(force_drag);
                
//                .call(force_drag);
            
            nodeEnter.append("circle")
                .attr("r", node_size);

            nodeEnter.append("text")
                .attr("dy", ".35em")
                .text(node_text); //html no function with transition?
//                .html(function(d) { return d.identifier + (d.title ? ": " + d.title : ""); });
            
            node.transition()
                .attr("class", function(d) {
                    return (d.subgenre ? "node " + d.subgenre[0].replace(" ", "_") : "node other");
                }) //determine color based on genre
            
            node.select("circle").transition()
                .attr("r", node_size);

            node.select("text").transition()
                .text(node_text); //html no function with transition?
            
            node.select("circle")
                .style("fill", color)
                .on("mouseover", function(d){
                    d3.select(this)
                        .transition()
                        .ease("elastic")
                        .attr("r", function(d) { 
                            return Math.min(Math.max(Math.sqrt(d.text_length * 5), 18), vm.max_nodes_size()) || 15; ;
                        });
                })
                .on("mouseout", function(d){
                    d3.select(this)
                        .transition()
                        .ease("elastic")
                        .attr("r", node_size);
                });
        
/*            // pin button
            pin_button = pin_button.data(graph.nodes);

            pin_button.exit().remove();

            var pin_buttonEnter = pin_button.enter().append("g")
                .attr("class", "pin_button")
                .on("contextmenu", dragstop)
                .on("dblclick", dragstop)
                .call(force_drag);

            pin_buttonEnter.append("circle")
                .attr("r", function(d) { return 8; });

            pin_buttonEnter.append("text")
                .attr("dy", ".3em")
                .text(function(d) { return "!"; });

            pin_button.select("circle")
                .style("fill", color);
*/
//#########################################################

            force.on("tick", function() {

                node.attr("transform", function(d) { 
                    return "translate(" + Math.max(0, Math.min(w, d.x)) + "," + Math.max(20, Math.min(h, d.y)) + ")"; });

                pin_button.attr("transform", function(d) {
//                    var outer = Math.min(Math.max(Math.sqrt(d.text_length * 3), 15), vm.max_nodes_size()) || 12
                    return "translate(" + Math.max(0, Math.min(w, d.x)) + "," + (Math.max(20, Math.min(h, d.y)) - (node_size(d))) + ")"; });

                link.attr("x1", function(d) { return Math.max(0, Math.min(w, d.source.x)); })
                    .attr("y1", function(d) { return Math.max(20, Math.min(h, d.source.y)); })
                    .attr("x2", function(d) { return Math.max(0, Math.min(w, d.target.x)); })
                    .attr("y2", function(d) { return Math.max(20, Math.min(h, d.target.y)); });
            //  faster but not so good.
/*                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });*/
            });
        }

        function right_click_node(item_data, index) {
            //handle right click
            console.log("right_clicking: " + index);
            //stop showing browser menu            
            d3.event.preventDefault();
//            dragstop(item_data);
//            vm.removeNode(index);
         }

        function collect_neighbors(d){
//            console.log(d);
            vm.doNeighborSearch(d);
            // tell VM to retrieve more nodes to attach to the tree
        }

        function color(d) {
//            vm.selectedLegendOptionValue();
            //retrieve possible values of metadata field from solr database
            //build new color index
            if (d.subgenre){
                return subgenre_colors[d.subgenre[0].replace(" ", "_")];
            }
            return subgenre_colors["none"]; //none
        }

        //removing links?
        function remove_link_click() {
            
        }

        // Toggle children on click.
        function left_click_link(item_data) {
            d3.event.preventDefault();
            console.log(item_data);
            
            var even = true;
            
            //make link ping, not nodes

            pinging[0] = item_data.source;
            pinging[1] = item_data.target;
            ping();
            pinging_link[0] = item_data
            ping_link();
            
            var list = d3.select("#linkDetailList");
            
            list.selectAll("li").remove();
            
            list.append("li")
                .attr("class", "linkTypeLabel")
                .html("<b>Score:</b> " + item_data.score);
            
//            for (meta in vm.metadatas_to_query()){
            $.each(vm.metadatas_to_query(), function(metaindex, metavalue){
                even = !even
                var print_this = [];
                if ((item_data["source"][metavalue.key]) || (item_data["target"][metavalue.key])){
                    same = [];
                    source = [];
                    target = [];
                    if (item_data["source"][metavalue.key] instanceof Array && item_data["target"][metavalue.key] instanceof Array){
                        source = jQuery.extend(true, [], item_data["source"][metavalue.key]);
                        target = jQuery.extend(true, [], item_data["target"][metavalue.key]);
                        for (item_s in item_data["source"][metavalue.key]){
                            for (item_t in item_data["target"][metavalue.key]){
                                if (item_data["source"][metavalue.key][item_s] == item_data["target"][metavalue.key][item_t]){
                                    same.push(item_data["source"][metavalue.key][item_s]);
                                    source.splice($.inArray(item_data["source"][metavalue.key][item_s], source), 1);
                                    target.splice($.inArray(item_data["target"][metavalue.key][item_t], target), 1);
                                }
                            }
                        }
                    }
                    else{
                        if (item_data["source"][metavalue.key] == item_data["target"][metavalue.key]){
                            same.push(item_data["source"][metavalue.key]);
                        }
                        else{
                            source.push(item_data["source"][metavalue.key]);
                            target.push(item_data["target"][metavalue.key]);
                        }
                    }
                    print_this = "<b>" + metavalue.key + ":</b>"
                    if (same.length > 0){   print_this += " <p style=\"color:green\">" + same.join(" | ") + "</p><hr>"; }
                    if (source.length > 0){ print_this += "<p style=\"color:darkred\">" + source.join(" | ") + "</p>"; }
                    if (target.length > 0){ print_this += "<hr><p style=\"color:darkred\">" + target.join(" | ") + "</p><hr>"; }
                    list.append("li")
                        .attr("class", "linkTypeLabel")
/*                        .style("background-color", function(){
                            if (even) { return "white"; }
                            else { return "lightgray"; }
                        })*/
                        .html(print_this);
                }
            });
//            update();
        }


        function left_click_node_wait(item_data){
            setTimeout(function(){
//                d3.event.preventDefault();
                left_click_node(item_data)
            }, 300);
        }
        
        
        // Toggle children on click.
        function left_click_node(item_data) {
//            d3.event.preventDefault();
//            console.log(item_data);

            pinging_link = [];
            pinging = [];
            pinging[0] = item_data;
            
            ping();
            
//            pinging.push(item_data);
/*            if (pinging.length > 1) {
                pinging.shift();
                ping();
            }
*/
            var list = d3.select("#linkDetailList");
            
            list.selectAll("li").remove();

            list.append("li").attr("class", "linkTypeLabel").html("<b>calculate all links: <button>" + item_data.id + "</button>");
            
            list.append("li").attr("class", "linkTypeLabel").html("<button class=\"cons_search_button\">New search</button>");

            list.append("li").attr("class", "linkTypeLabel").html("<b>URL: </b> " + "<a target=\"folktale\" href=\"http://www.verhalenbank.nl/items/show/" + item_data.id + "\">" + item_data.id + " - " + item_data.identifier + " - " + item_data.title + "</a>");
            
            d3.select('.cons_search_button')
                .on('click', function() {
                    vm.ConsSearch(item_data.id);
            });
            
            var even = true;

            for (meta in vm.metadatas_to_show()){
                even = !even;
                meta = vm.metadatas_to_show()[meta];
                print_this = "";
                if (item_data[meta] instanceof Array){
                    print_this = "<b>" + meta + ":</b> " + item_data[meta].join(" | ");
                }
                else{
                    print_this = "<b>" + meta + ":</b> " + item_data[meta];
                }
                list.append("li")
                    .attr("class", "linkTypeLabel")
                    .style("background-color", function(){
                        if (even) { return "white"; }
                        else { return "lightgray"; }
                    })
                    .html(print_this);
            }
//            d3.select(this).classed("fixed", item_data.fixed = false);
//            update();
        }

        function dragstop(d) {
            d3.event.preventDefault();
            d3.select(this).classed("fixed", d.fixed = false);
        }

        function dragstart(d) {
//            if (d3.event.defaultPrevented) return;
            d3.select(this).classed("fixed", d.fixed = true);
        }

        function setParents(d, p){
            d._parent = p;
            if (d.children) {
                d.children.forEach(function(e){ setParents(e,d);});
            } else if (d._children) {
                d._children.forEach(function(e){ setParents(e,d);});
            }
        }

        function setLegendList() {
            console.log(vm.subgenre_colors());
            
            var list = d3.select("#legendList").selectAll("li")
                .data(d3.entries(vm.subgenre_colors()))
                .enter().append("li")
                .style("background-color", function(d) { 
                    return d.value;
                })
                .html(function(d) { 
                    return "<b>" + d.key + "</b>";
                })
                .on("mouseover", function(d){
                    d3.selectAll("." + d.key).select("circle")
                        .transition()
                        .ease("elastic")
                        .style("stroke-width", 8) 
                })
                .on("mouseout", function(d){
                    d3.selectAll("." + d.key).select("circle")
                        .transition()
                        .ease("elastic")
                        .style("stroke-width", 1.5) 
                });
        }


        function setLegendListOLD() {
            var llist = d3.select("#legendList");
            llist.selectAll("li").remove();
            for (c in vm.subgenre_colors()){
                llist.append("li")
                    .attr("class", "linkTypeLabel")
                    .style("background-color", vm.subgenre_colors()[c])
                    .html("<b>" + c + "</b>")
                    .on("mouseover", function(){
                        console.log("mouse over legend " + c);
                        d3.selectAll("." + c)
                            .transition()
                            .ease("elastic")
                            .attr("r", 100)
                            .attr("stroke-width", 10);
                        })
                    .on("mouseout", function(d){
                    });
            }
        }

        vm.node_params.subscribe( function(){
            force.linkDistance(vm.node_params()["linkDistance"].value())
//                .(vm.node_params()["linkStrength"].value())
                .distance(vm.node_params()["distance"].value())
                .charge(vm.node_params()["charge"].value())
                .gravity(vm.node_params()["gravity"].value())
                .friction(vm.node_params()["friction"].value())
                .theta(vm.node_params()["theta"].value())
                .size([w, h]);
            force.start();
        });

        vm.link_colors_by_score_strength.subscribe( function (){
            update();
        });

        vm.nodes_same_size.subscribe( function (){
            update();
        });

        vm.links_same_size.subscribe( function (){
            update();
        });

        vm.network_graph.subscribe( function (){
            update();
        });

        vm.title_in_node.subscribe( function (){
            update();
        });
        

    }
}