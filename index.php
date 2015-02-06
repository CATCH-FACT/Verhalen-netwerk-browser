<!DOCTYPE html>
<html>
    <head>
        <script type="text/javascript" src="js/d3.min.js"></script>
        <script type="text/javascript" src="js/jquery-1.11.1.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/knockout-3.1.0.js"></script>
        <script type="text/javascript" src="js/expandable_nodes.js"></script>
        <script type="text/javascript" src="js/dynamic_pie_charts.js"></script>
        <script type="text/javascript" src="js/main.js"></script>
        <link rel="stylesheet" type="text/css" href="css/style.css" media="all"/>
        <link rel="stylesheet" type="text/css" href="css/jquery-ui.min.css" media="all"/>
        <title>Nederlandse Volksverhalen Netwerk</title>
    </head>
  
    <body>
        <div class="toplayer viewer" id="waitWindow"><br><center>Please <br> wait..</center></div>
        
        <div id="accordion-resizer" class="ui-widget-content">
            <div id="accordion">
                
                <h3>Search & manipulation</h3>
                <div class="search" id="search_container">
                    <h4>Identifier(s):</h4>
                    <input id="searchBox" class="input-search" data-bind="value:id_search_query, valueUpdate: 'afterkeydown', event: { keypress: searchKeyboardCmd}" style='width:98%'/>
                    <br>
                    <button class="search_button" data-bind="click:doIdSearch">Search</button>
                    <button class="add_button" data-bind="click:doIdAdd">Add</button>
                    <button class="reset_button" data-bind="click:emptySearchbox">Clear</button>
                    <br>
<!--                    <hr>
                    OR VB searchlink:
                    <br>
                    <input id="vb_searchBox" class="input-search" data-bind="value:vb_search_link, valueUpdate: 'afterkeydown', event: { keypress: searchKeyboardCmdVB}" style='width:98%'/>
                    <br>
                    <button class="vb_search_button" data-bind="click:doVBSearch">Search</button>
                    <button class="vb_reset_button" data-bind="click:emptyVBSearchbox">Clear</button>-->
                    <hr>
                    OR SolR query:
                    <br>
                    <input id="solr_searchBox" class="input-search" data-bind="value:solr_search_command, valueUpdate: 'afterkeydown', event: { keypress: searchKeyboardCmdSolR}" style='width:98%'/>
                    <br>
                    <button class="solr_search_button" data-bind="click:doSolrSearch">Search</button>
                    <button class="solr_reset_button" data-bind="click:emptySolrSearchbox">Clear</button>
                    <br>
                    <hr>
                    <h4>Node manipulation:</h4>
                    Minimum score: <input data-bind="value: min_neighbor_score, valueUpdate: 'afterkeydown'" />
                    <div data-bind="slider: min_neighbor_score, sliderOptions: {min: 1, max: 25, range: 'min', step: 0.1}"></div>
                    <br>
                    <button id="expand" data-bind="click:neighborsExpand">expand existing nodes</button>
                    <button id="connect" data-bind="click:connectNeighbors">re-connect ALL nodes</button>
                    <br>
                    <br>
                    <button class="clear_button" data-bind="click:clearData">Remove ALL nodes</button>
                    <button id="kill_lonely" data-bind="click:killLonelyNodes">Remove lonely nodes</button>
                    <button id="kill_selected" data-bind="click:killSelectedNodes">Remove selected nodes</button>
                    <hr>                    
                    <h4>Simple options</h4>
                    <label><input type="checkbox" data-bind="checked: link_colors_by_score_strength" />Links based on color</label><br>
                    <label><input type="checkbox" data-bind="checked: links_same_size" />Links all same size</label><br>
                    <div data-bind="slider: links_width, sliderOptions: {min: 1, max: 15, range: 'min', step: 1}"></div>
                    <label><input type="checkbox" data-bind="checked: nodes_same_size" />Nodes all same size</label><br>
                    <div data-bind="slider: nodes_size, sliderOptions: {min: 1, max: 25, range: 'min', step: 1}"></div>
                    <br>
                    <br>
                    <label><input type="checkbox" data-bind="checked: title_in_node" />Title in node</label><br>
                    <label><input type="checkbox" data-bind="checked: show_dragbubbles" />Show Dragbubbles</label><br>

                    <h4>Advanced options</h4>
                    <ul class="controls">
                      <br>
                      <li>charge(<span class="value">-120</span>)<div id="charge"></div></li>
                      <li>gravity(<span class="value">0.1</span>)<div id="gravity"></div></li>
                      <br>
<!--                      <li>linkDistance(<span class="value">30</span>)<div id="linkDistance"></div></li>-->
                      <li>distance(<span class="value">50</span>)<div id="distance"></div></li>
                      <li>linkStrength(<span class="value">1</span>)<div id="linkStrength"></div></li>
                      <li>friction(<span class="value">0.5</span>)<div id="friction"></div></li>
                      <li>theta(<span class="value">0.3</span>)<div id="theta"></div></li>
                      <br>
                    </ul>
                    <br>
                    <br>
                </div>
                
                <h3>Metadata list</h3>
                <div class="control" id="viewSettings">
                    <label style="text-color=red"><input type="checkbox" data-bind="checked: all_checked" />All</label>
                    <div data-bind="foreach: metadatas_to_query">
                        <input type="checkbox" data-bind="checked: selected" />
                        <input data-bind="value: score_value, valueUpdate: 'afterkeydown', disable: !selected()" style='width:20px'/>
                        <span data-bind="text: key, style: { color: selected() ? 'black' : 'lightgrey' }" /></span>
                        <br>
                    </div>
                </div>

                <h3>Color legend</h3>
                <div id="legendList">
                    <select size=5 style="width:100%" data-bind="options: legendOptionValues, value: selectedLegendOptionValue"></select>
                    <br>
                </div>

                <h3>Download data</h3>
                <div class="control" id="viewSettings">
                </div>
                
                <h3>Help and info</h3>
                <div id="infoTab"></div>
                
            </div>
        </div>

        <div id="tabs">
            <ul>
              <li><a href="#tabs-1">Details</a></li>
              <li><a href="#tabs-2">Facets</a></li>
            </ul>
            <div id="tabs-1">
            </div>
            <div id="tabs-2">
                <div class="div_RootBody" id="pie_chart_2">
                    <div class="chart"></div>
                </div>
            </div>

        </div>

        <center><span data-bind="text: total_nodes"></span>
    </body>
</html>