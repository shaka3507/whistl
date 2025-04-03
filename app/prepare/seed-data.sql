-- Seed data for emergency preparedness categories and template items

-- First, clear existing data if needed (uncomment if needed)
-- DELETE FROM public.prepare_list_items;
-- DELETE FROM public.prepare_lists;
-- DELETE FROM public.prepare_template_items;
-- DELETE FROM public.prepare_categories;

-- Insert Categories
INSERT INTO public.prepare_categories (name, description, icon) VALUES
('Earthquake', 'Be prepared for earthquakes with these essential items to stay safe during and after seismic events.', 'earthquake'),
('Tsunami', 'Crucial supplies to have ready in coastal areas vulnerable to tsunamis.', 'water'),
('Hurricane', 'Essential items to weather the storm and deal with potential flooding and power outages.', 'wind'),
('Tornado', 'Supplies to help you take shelter and stay safe during extreme wind events.', 'wind'),
('Wildfire', 'Items to prepare your home and family for evacuation during wildfire threats.', 'flame'),
('Winter Storm', 'Supplies to keep warm and safe during extreme cold, snow, and ice.', 'snowflake'),
('Flood', 'Items to protect your property and family during flood events.', 'droplet'),
('General Emergency', 'Basic emergency preparedness supplies that every household should have.', 'alert-circle')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
    earthquake_id INTEGER;
    tsunami_id INTEGER;
    hurricane_id INTEGER;
    tornado_id INTEGER;
    wildfire_id INTEGER;
    winter_id INTEGER;
    flood_id INTEGER;
    general_id INTEGER;
BEGIN
    SELECT id INTO earthquake_id FROM public.prepare_categories WHERE name = 'Earthquake';
    SELECT id INTO tsunami_id FROM public.prepare_categories WHERE name = 'Tsunami';
    SELECT id INTO hurricane_id FROM public.prepare_categories WHERE name = 'Hurricane';
    SELECT id INTO tornado_id FROM public.prepare_categories WHERE name = 'Tornado';
    SELECT id INTO wildfire_id FROM public.prepare_categories WHERE name = 'Wildfire';
    SELECT id INTO winter_id FROM public.prepare_categories WHERE name = 'Winter Storm';
    SELECT id INTO flood_id FROM public.prepare_categories WHERE name = 'Flood';
    SELECT id INTO general_id FROM public.prepare_categories WHERE name = 'General Emergency';

    -- Earthquake Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (earthquake_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (earthquake_id, 'Non-perishable Food', 'Three-day supply of food that requires no refrigeration', 3, 'days worth'),
    (earthquake_id, 'Flashlight', 'Battery-powered or hand-crank flashlight', 2, 'flashlights'),
    (earthquake_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit'),
    (earthquake_id, 'Battery-powered Radio', 'For emergency broadcasts and news', 1, 'radio'),
    (earthquake_id, 'Extra Batteries', 'For flashlights and radio', 12, 'batteries'),
    (earthquake_id, 'Whistle', 'To signal for help if trapped', 1, 'whistle'),
    (earthquake_id, 'Dust Mask', 'To filter contaminated air after building damage', 5, 'masks per person'),
    (earthquake_id, 'Plastic Sheeting', 'For shelter-in-place or temporary repairs', 1, 'roll'),
    (earthquake_id, 'Duct Tape', 'For emergency repairs', 1, 'roll'),
    (earthquake_id, 'Moist Towelettes', 'For personal sanitation', 20, 'towelettes'),
    (earthquake_id, 'Garbage Bags', 'For personal sanitation and waste containment', 20, 'bags'),
    (earthquake_id, 'Wrench/Pliers', 'To turn off utilities', 1, 'set');

    -- Tsunami Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (tsunami_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (tsunami_id, 'Non-perishable Food', 'Three-day supply of food that requires no refrigeration', 3, 'days worth'),
    (tsunami_id, 'Water Filtration System', 'For purifying contaminated water', 1, 'system'),
    (tsunami_id, 'Life Jackets', 'Personal flotation devices for each family member', 1, 'per person'),
    (tsunami_id, 'Waterproof Document Container', 'To protect important documents', 1, 'container'),
    (tsunami_id, 'Waterproof Flashlight', 'Water-resistant flashlight', 2, 'flashlights'),
    (tsunami_id, 'Emergency Blankets', 'Thermal blankets to prevent hypothermia', 1, 'per person'),
    (tsunami_id, 'Portable Radio', 'For emergency broadcasts and tsunami warnings', 1, 'radio'),
    (tsunami_id, 'Extra Batteries', 'For flashlights and radio', 12, 'batteries'),
    (tsunami_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit'),
    (tsunami_id, 'Waterproof Matches', 'For emergency heat and cooking', 1, 'box'),
    (tsunami_id, 'Whistle', 'To signal for help', 1, 'per person'),
    (tsunami_id, 'Emergency Evacuation Map', 'Map showing evacuation routes to higher ground', 1, 'map');

    -- Hurricane Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (hurricane_id, 'Emergency Water', 'One gallon per person per day for at least seven days', 7, 'gallons per person'),
    (hurricane_id, 'Non-perishable Food', 'Seven-day supply of food', 7, 'days worth'),
    (hurricane_id, 'Plywood Sheets', 'To board up windows', 10, 'sheets'),
    (hurricane_id, 'Tarps', 'For temporary roof or window repair', 2, 'tarps'),
    (hurricane_id, 'Battery-powered Radio', 'For emergency broadcasts and news', 1, 'radio'),
    (hurricane_id, 'Flashlights', 'For power outages', 2, 'flashlights'),
    (hurricane_id, 'Extra Batteries', 'For flashlights and radio', 24, 'batteries'),
    (hurricane_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit'),
    (hurricane_id, 'Portable Generator', 'For temporary power during outages', 1, 'generator'),
    (hurricane_id, 'Fuel for Generator', 'Stored safely in approved containers', 10, 'gallons'),
    (hurricane_id, 'Chainsaw', 'For removing fallen trees and branches', 1, 'chainsaw'),
    (hurricane_id, 'Waterproof Container', 'For important documents', 1, 'container'),
    (hurricane_id, 'Cash', 'In case ATMs and credit card systems are down', 300, 'dollars');

    -- Tornado Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (tornado_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (tornado_id, 'Non-perishable Food', 'Three-day supply of food', 3, 'days worth'),
    (tornado_id, 'Bicycle or Motorcycle Helmets', 'To protect head from falling debris', 1, 'per person'),
    (tornado_id, 'Weather Radio', 'NOAA weather radio with alert function', 1, 'radio'),
    (tornado_id, 'Flashlights', 'For power outages', 2, 'flashlights'),
    (tornado_id, 'Extra Batteries', 'For flashlights and radio', 12, 'batteries'),
    (tornado_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit'),
    (tornado_id, 'Whistle', 'To signal location if trapped', 1, 'per person'),
    (tornado_id, 'Sturdy Shoes', 'To protect feet from broken glass and debris', 1, 'pair per person'),
    (tornado_id, 'Work Gloves', 'For handling debris', 1, 'pair per person'),
    (tornado_id, 'Heavy Blankets', 'For protection from debris or warmth', 1, 'per person'),
    (tornado_id, 'Tarp', 'For temporary shelter or repairs', 1, 'tarp'),
    (tornado_id, 'Emergency Evacuation Plan', 'Written plan for family evacuation', 1, 'plan');

    -- Wildfire Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (wildfire_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (wildfire_id, 'Non-perishable Food', 'Three-day supply of food', 3, 'days worth'),
    (wildfire_id, 'N95 Respirator Masks', 'To filter smoke and particles', 5, 'per person'),
    (wildfire_id, 'Goggles', 'To protect eyes from smoke and ash', 1, 'per person'),
    (wildfire_id, 'Emergency Go Bag', 'Pre-packed bag with essentials for quick evacuation', 1, 'bag per person'),
    (wildfire_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit'),
    (wildfire_id, 'Battery-powered Radio', 'For emergency broadcasts and evacuation orders', 1, 'radio'),
    (wildfire_id, 'Flashlights', 'For visibility during evacuation or power outages', 2, 'flashlights'),
    (wildfire_id, 'Extra Batteries', 'For flashlights and radio', 12, 'batteries'),
    (wildfire_id, 'Important Documents Folder', 'Waterproof container with insurance, IDs, etc.', 1, 'folder'),
    (wildfire_id, 'Emergency Blanket', 'Reflective emergency blanket', 1, 'per person'),
    (wildfire_id, 'Bandanas', 'Can be soaked in water to cover mouth/nose', 2, 'per person'),
    (wildfire_id, 'Map of Local Area', 'Physical map with evacuation routes marked', 1, 'map');

    -- Winter Storm Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (winter_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (winter_id, 'Non-perishable Food', 'Three-day supply of food', 3, 'days worth'),
    (winter_id, 'Winter Clothing', 'Warm layers, hats, gloves, boots', 1, 'set per person'),
    (winter_id, 'Heavy Blankets', 'For warmth during power outages', 2, 'per person'),
    (winter_id, 'Sleeping Bags', 'Rated for below-freezing temperatures', 1, 'per person'),
    (winter_id, 'Snow Shovel', 'For clearing paths and exits', 1, 'shovel'),
    (winter_id, 'Ice Melt/Salt', 'To clear ice from walkways', 10, 'pounds'),
    (winter_id, 'Portable Heater', 'Non-electric backup heating source', 1, 'heater'),
    (winter_id, 'Fuel for Heater', 'Appropriate fuel for your backup heat source', 5, 'gallons/tanks'),
    (winter_id, 'Carbon Monoxide Detector', 'Battery-powered to detect CO from heaters', 1, 'detector'),
    (winter_id, 'Flashlights', 'For power outages', 2, 'flashlights'),
    (winter_id, 'Extra Batteries', 'For flashlights and other devices', 12, 'batteries'),
    (winter_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit');

    -- Flood Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (flood_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (flood_id, 'Non-perishable Food', 'Three-day supply of food', 3, 'days worth'),
    (flood_id, 'Water Filtration System', 'For purifying contaminated water', 1, 'system'),
    (flood_id, 'Life Jackets', 'Personal flotation devices', 1, 'per person'),
    (flood_id, 'Waders or Waterproof Boots', 'For walking through shallow floodwaters when necessary', 1, 'pair per person'),
    (flood_id, 'Sandbags', 'For diverting water from home', 20, 'bags'),
    (flood_id, 'Waterproof Document Container', 'For important papers and documents', 1, 'container'),
    (flood_id, 'First Aid Kit', 'Basic first aid supplies for injuries', 1, 'kit'),
    (flood_id, 'Battery-powered Radio', 'For emergency broadcasts and warnings', 1, 'radio'),
    (flood_id, 'Flashlights', 'For power outages', 2, 'flashlights'),
    (flood_id, 'Extra Batteries', 'For flashlights and radio', 12, 'batteries'),
    (flood_id, 'Plastic Sheeting', 'For emergency waterproofing', 1, 'roll'),
    (flood_id, 'Utility Knife', 'Multi-purpose tool for emergency situations', 1, 'knife');

    -- General Emergency Items
    INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
    (general_id, 'Emergency Water', 'One gallon per person per day for at least three days', 3, 'gallons per person'),
    (general_id, 'Non-perishable Food', 'Three-day supply of food', 3, 'days worth'),
    (general_id, 'First Aid Kit', 'Comprehensive kit with manual', 1, 'kit'),
    (general_id, 'Flashlights', 'Battery-powered or hand-crank', 2, 'flashlights'),
    (general_id, 'Battery-powered Radio', 'For emergency information', 1, 'radio'),
    (general_id, 'Extra Batteries', 'For all devices', 12, 'batteries'),
    (general_id, 'Emergency Blankets', 'Mylar thermal blankets', 1, 'per person'),
    (general_id, 'Multi-tool or Utility Knife', 'For various emergency needs', 1, 'tool'),
    (general_id, 'Whistle', 'To signal for help', 1, 'per person'),
    (general_id, 'Dust Masks', 'Basic protection from airborne particles', 5, 'per person'),
    (general_id, 'Moist Towelettes', 'For personal sanitation', 20, 'towelettes'),
    (general_id, 'Garbage Bags', 'For waste and many other uses', 20, 'bags'),
    (general_id, 'Local Maps', 'Physical maps of your area', 1, 'set'),
    (general_id, 'Cell Phone with Chargers', 'Include backup battery or solar charger', 1, 'per person'),
    (general_id, 'Emergency Contact List', 'Physical copy of important phone numbers', 1, 'list'),
    (general_id, 'Cash and Coins', 'Small bills and coins for when electronic payments are down', 200, 'dollars'),
    (general_id, 'Prescription Medications', 'At least 7-day supply of essential medications', 7, 'days supply');
END $$; 