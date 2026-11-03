export const projects = [
{id:'box',icon:'▣',title:'A box that fits',tag:'Design two parts together',level:'FIT & MEASURE',time:'35–50 min',category:'Fit',accent:'#8270d8',
question:'Can you change the size of a box and still make its lid fit?',hint:'Change the inside width. The outside walls and the lid update together. What stays the same?',skills:['Measurement','Clearance','Connected dimensions'],
steps:['Measure an object you want to protect. Give it a little extra room.','Set the inside dimensions. Choose a lid clearance.','Print the box and lid. Test the fit and record what you would change.'],criteria:['Your object fits inside.','The lid sits in the opening without force.','Wall thickness stays the same when the box changes size.'],connection:'Bring the STL into SimpCAD X or Tinkercad to add decorative shapes. Return here to change the fit or inside dimensions.',parts:[['all','Box + lid'],['box','Box only'],['lid','Lid only']],code:`/* [Inside dimensions] */
// Space available inside the box, in mm
inside_width = 60; // [30:1:110]
inside_depth = 45; // [25:1:90]
inside_height = 30; // [15:1:65]
/* [Fit & strength] */
// Space on each side of the lid tongue, in mm
clearance = 0.3; // [0.15:0.05:0.6]
// Wall and floor thickness, in mm
wall = 2.5; // [2:0.5:5]
/* [Hidden] */
part="all";
lip=4;
ow=inside_width+2*wall; od=inside_depth+2*wall;
module box_part(){difference(){cube([ow,od,inside_height+wall]);translate([wall,wall,wall])cube([inside_width,inside_depth,inside_height+1]);}}
module lid_part(){union(){cube([ow,od,wall]);translate([wall+clearance,wall+clearance,wall-0.1])difference(){cube([inside_width-2*clearance,inside_depth-2*clearance,lip+0.1]);translate([wall,wall,-1])cube([inside_width-2*clearance-2*wall,inside_depth-2*clearance-2*wall,lip+3]);}}}
if(part=="all"||part=="box")box_part();
if(part=="all")translate([ow+10,0,0])lid_part();
if(part=="lid")lid_part();`},
{id:'fit',icon:'◎',title:'The fit detective',tag:'Test before the big print',level:'TEST & IMPROVE',time:'30–45 min + printing',category:'Fit',accent:'#4b9a87',question:'How much space does your printer need between two parts?',hint:'The three holes use different clearances. Predict which will fit best before you print.',skills:['Fair tests','Tolerances','Evidence'],steps:['Choose a pin diameter and a starting clearance.','Print the three labeled holes and the matching pin. Change only one variable.','Try the pin in each hole. Record the best fit for this printer and material.'],criteria:['You predict a result before testing.','You test all three holes with the same pin.','Your next design uses clearance supported by your results.'],connection:'Use your measured clearance in A box that fits, or use these test parts alongside a model built in your visual editor.',parts:[['all','Holes + pin'],['holes','Holes only'],['pin','Pin only']],code:`/* [Your experiment] */
// Diameter of the matching pin, in mm
pin_diameter = 8; // [5:0.5:12]
// Clearance on each side of the middle hole, in mm
clearance = 0.25; // [0.1:0.05:0.5]
// Difference between neighboring samples, in mm
increment = 0.1; // [0.05:0.05:0.1]
/* [Hidden] */
$fn=48;
part="all";
module holes(){for(i=[0:2])translate([i*28,0,0])union(){difference(){cube([24,28,5]);translate([12,11,-1])cylinder(d=pin_diameter+2*(clearance+(i-1)*increment),h=7);}translate([12,22,4.9])linear_extrude(0.7)text(str(clearance+(i-1)*increment),size=3.5,halign="center");}}
module pin(){cylinder(d=pin_diameter+5,h=3);translate([0,0,2.9])cylinder(d=pin_diameter,h=15.1);}
if(part=="all"||part=="holes")holes();
if(part=="all")translate([12,43,0])pin();
if(part=="pin")pin();`},
{id:'puzzle',icon:'✥',title:'Puzzle workshop',tag:'Turn a pattern into a part',level:'PATTERNS & LOGIC',time:'25–40 min',category:'Patterns',accent:'#b48a52',question:'Can a drawing of squares become a 3D puzzle piece?',hint:'Click squares to change the shape. Keep the colored squares touching along their edges.',skills:['Patterns','Spatial reasoning','Representation'],steps:['Draw a small grid and mark the squares your piece will fill.','Click the grid squares to draw your piece. Colored squares become solid blocks.','Compare the drawing and model. Change one row and predict the new shape.'],criteria:['Your pattern matches your drawing.','Your piece is connected.','You can explain how the row pattern becomes a solid.'],connection:'Export a piece for a larger assembly in SimpCAD X or Tinkercad. A single pattern is a piece-design exercise; it does not automatically create a solvable puzzle.',code:`include <puzzlecad.scad>
/* [Pattern] */
// x is filled, . is empty, | starts a new row
pattern = "xxx|.x.";
/* [Size & edges] */
// Width of one grid square, in mm
block_size = 12; // [8:1:20]
// Small bevel on the edges, in mm
bevel = 0.5; // [0:0.1:1]
/* [Hidden] */
burr_piece(pattern,$burr_scale=block_size,$burr_inset=0.07,$burr_bevel=bevel);`},
{id:'tag',icon:'◇',title:'Make your mark',tag:'Lettering that scales with you',level:'IDENTITY & SCALE',time:'20–30 min',category:'Personalize',accent:'#c48d62',question:'How can a tag stay readable when the name or size changes?',hint:'Try a short name and a long name. The lettering resizes to stay inside the tag.',skills:['Scale','Constraints','User needs'],steps:['Choose a name or short message. Decide who will use the tag.','Set the size and clip hole. Check readability from a distance.','Print and test it with a clip or ring. Revise one setting.'],criteria:['All letters fit on the tag.','The clip hole stays inside the edge.','The message is readable at the finished size.'],connection:'Use the finished tag as a base for extra shapes in your visual editor, or change the message here to make a class set.',code:`/* [Your message] */
// Up to 16 characters. Try initials, a nickname, or a short message.
name = "MAKER";
/* [Size] */
length = 65; // [45:1:100]
width = 26; // [20:1:40]
thickness = 3; // [2.5:0.5:6]
// Diameter of the clip hole, in mm
hole = 5; // [3:0.5:8]
/* [Hidden] */
$fn=48;
difference(){hull(){translate([width/2,0,0])cylinder(d=width,h=thickness);translate([length-width/2,0,0])cylinder(d=width,h=thickness);}translate([8,0,-1])cylinder(d=hole,h=thickness+2);}
letter_size=min(width*0.5,(length-22)*1000/max(1,_ms_width(name,1)));
translate([(length+14)/2,-letter_size*0.35,thickness-0.1])linear_extrude(1.1)text(name,size=letter_size,halign="center");`},
{id:'stand',icon:'⌁',title:'Stand & deliver',tag:'Design for a real device',level:'BALANCE & SUPPORT',time:'30–45 min',category:'Structure',accent:'#5c95b2',question:'How does a stand support an object without tipping?',hint:'Measure your device and its case. Compare a deep base with a shallow one before printing.',skills:['Measurement','Balance','Iteration'],steps:['Measure the width and thickness of the object your stand will hold.','Choose the base depth, back height, and angle. Predict where it could tip.','Test on a level surface. Record what changes make it more stable.'],criteria:['The device sits behind the front lip.','The base stays flat on the table.','Your design changes respond to an observed test.'],connection:'Add cable guides, symbols, or other features in a visual editor. Return here to vary the support dimensions consistently.',code:`/* [Support dimensions] */
width = 65; // [40:1:100]
depth = 60; // [45:1:90]
height = 60; // [35:1:90]
// Lean of the back support, in degrees
angle = 12; // [0:1:20]
/* [Details] */
wall = 4; // [3:0.5:6]
cable_gap = true;
/* [Hidden] */
difference(){union(){cube([width,depth,wall]);translate([0,depth-wall,wall-0.5])rotate([angle,0,0])cube([width,wall,height]);cube([width,wall,12]);}if(cable_gap)translate([width/2-7,-1,wall])cube([14,wall+2,13]);}`},
{id:'cup',icon:'▥',title:'A place for everything',tag:'Compartments that stay equal',level:'SPACE & EFFICIENCY',time:'30–45 min',category:'Structure',accent:'#858f60',question:'Can you organize the same space in more than one useful way?',hint:'Change the number of compartments. The dividers resize and space themselves evenly.',skills:['Area','Equal spacing','Material choices'],steps:['Choose the items you want to organize. Measure the biggest one.','Set the footprint and divide it into useful spaces.','Compare two layouts. Which uses the space better, and why?'],criteria:['Your objects fit into the compartments.','The dividers stay evenly spaced.','You can justify the number and size of compartments.'],connection:'Export the organizer and add handles, decorative shapes, or other features in SimpCAD X or Tinkercad.',code:`/* [Overall size] */
width = 85; // [60:1:120]
depth = 65; // [45:1:100]
height = 45; // [25:1:80]
/* [Compartments] */
columns = 2; // [1:1:4]
rows = 1; // [1:1:3]
wall = 2.5; // [2:0.5:4]
/* [Hidden] */
cw=(width-(columns+1)*wall)/columns;
cd=(depth-(rows+1)*wall)/rows;
difference(){cube([width,depth,height]);for(x=[0:columns-1])for(y=[0:rows-1])translate([wall+x*(cw+wall),wall+y*(cd+wall),wall])cube([cw,cd,height+1]);}`}
];
export function template(id){return projects.find(p=>p.id===id);}
