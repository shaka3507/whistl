-- Supplemental Emergency Preparedness Items
-- This script adds template items for various emergency categories

-- Avalanche (ID: 10)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(10, 'Avalanche Beacon', 'Electronic device that emits a signal for rescuers to locate you under snow', 1, 'per person'),
(10, 'Avalanche Probe', 'Collapsible pole used to locate buried victims', 1, 'per person'),
(10, 'Avalanche Shovel', 'Compact, collapsible shovel for digging in snow', 1, 'per person'),
(10, 'AvaLung or Breathing Device', 'Device to extract air from snow if buried', 1, 'per person'),
(10, 'Brightly Colored Clothing', 'High-visibility clothing to be seen in snow', 1, 'set per person'),
(10, 'GPS Device', 'For navigation and location tracking in snow conditions', 1, 'device');

-- Biological Hazard (ID: 28)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(28, 'N95 or P100 Respirators', 'NIOSH-approved respirators to filter airborne particles', 10, 'per person'),
(28, 'Protective Gloves', 'Disposable nitrile or latex gloves', 50, 'pairs'),
(28, 'Hand Sanitizer', 'Alcohol-based hand sanitizer (at least 60% alcohol)', 5, 'bottles'),
(28, 'Disinfectant Wipes', 'For cleaning and disinfecting surfaces', 10, 'packs'),
(28, 'Protective Clothing', 'Disposable coveralls or gowns', 5, 'per person'),
(28, 'Face Shields', 'Full face protection against splashes', 2, 'per person'),
(28, 'Plastic Sheeting', 'For sealing off rooms during shelter-in-place', 2, 'rolls'),
(28, 'Medical Waste Bags', 'For safe disposal of contaminated materials', 20, 'bags');

-- Blizzard (ID: 11)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(11, 'Snow Shovel', 'Heavy-duty shovel for clearing snow', 1, 'shovel'),
(11, 'Ice Scraper/Snow Brush', 'For clearing vehicle windows', 1, 'per vehicle'),
(11, 'Rock Salt/Ice Melt', 'For melting ice on walkways', 10, 'pounds'),
(11, 'Insulated Snow Boots', 'Waterproof boots with good traction', 1, 'pair per person'),
(11, 'Thermal Underwear', 'Base layer for extreme cold', 2, 'sets per person'),
(11, 'Heating Fuel', 'Extra heating fuel or firewood', 10, 'days worth'),
(11, 'Snow Chains', 'Tire chains for vehicles in snow conditions', 1, 'set per vehicle'),
(11, 'Insulated Gloves', 'Heavy-duty waterproof gloves', 1, 'pair per person');

-- Chemical Spill (ID: 18)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(18, 'P100 Respirator', 'Chemical-resistant air filtration mask', 1, 'per person'),
(18, 'Chemical Resistant Gloves', 'Heavy-duty gloves that resist chemical permeation', 2, 'pairs'),
(18, 'Plastic Sheeting', 'For sealing windows and doors', 2, 'rolls'),
(18, 'Duct Tape', 'For sealing plastic sheeting', 2, 'rolls'),
(18, 'Emergency Radio', 'For updates on evacuation orders', 1, 'radio'),
(18, 'Eye Protection', 'Chemical splash goggles', 1, 'per person'),
(18, 'Emergency Contact List', 'List of emergency response agencies', 1, 'copy'),
(18, 'Evacuation Plan', 'Written plan with multiple routes away from hazard', 1, 'plan');

-- Cyber Attack (ID: 27)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(27, 'External Hard Drive', 'For offline data backup', 1, 'drive per device'),
(27, 'Paper Copies of Records', 'Physical copies of essential documents', 1, 'set'),
(27, 'Cash Reserve', 'In case electronic payment systems fail', 500, 'dollars'),
(27, 'Portable Radio', 'Non-internet based news source', 1, 'radio'),
(27, 'Offline Maps', 'Physical maps of your area', 1, 'set'),
(27, 'Paper Address Book', 'Physical copies of important contact information', 1, 'book'),
(27, 'Manual Can Opener', 'For food access without electricity', 1, 'opener'),
(27, 'Hardware Authentication Keys', 'Physical security keys for account access', 2, 'keys');

-- Deforestation (ID: 23)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(23, 'Air Purifier', 'To filter particulate matter from degraded air quality', 1, 'per room'),
(23, 'Water Filters', 'For filtering potentially contaminated water', 2, 'filters'),
(23, 'Rainwater Collection System', 'For alternative water source', 1, 'system'),
(23, 'Drought-Resistant Seeds', 'For growing food in changing conditions', 5, 'packets'),
(23, 'Erosion Control Materials', 'For preventing soil loss', 5, 'square meters'),
(23, 'Tree Seedlings', 'For reforestation efforts', 10, 'seedlings'),
(23, 'Soil Testing Kit', 'To monitor soil health', 1, 'kit');

-- Drought (ID: 7)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(7, 'Water Storage Containers', 'Large containers for long-term water storage', 5, 'containers'),
(7, 'Water Purification Tablets', 'For treating questionable water sources', 100, 'tablets'),
(7, 'Low-Flow Fixtures', 'Water-conserving faucets and showerheads', 1, 'per fixture'),
(7, 'Rain Barrels', 'For collecting and storing rainwater', 2, 'barrels'),
(7, 'Moisture Meters', 'For efficient garden watering', 2, 'meters'),
(7, 'Drought-Resistant Plants', 'Low-water landscaping', 10, 'plants'),
(7, 'Gray Water System', 'For reusing household water', 1, 'system'),
(7, 'Shade Cloth', 'For protecting plants from excessive sun', 2, 'sheets');

-- Hailstorm (ID: 14)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(14, 'Car Cover', 'Padded cover to protect vehicles from hail damage', 1, 'per vehicle'),
(14, 'Window Shutters', 'Protective coverings for windows', 1, 'per window'),
(14, 'Roof Inspection Kit', 'For checking roof damage after storms', 1, 'kit'),
(14, 'Temporary Roof Patches', 'For emergency roof repairs', 5, 'patches'),
(14, 'Impact-Resistant Roofing', 'For long-term protection', 1, 'roof'),
(14, 'Weather Alert Radio', 'For advance warning of severe storms', 1, 'radio'),
(14, 'Plywood Sheets', 'For covering windows in emergency', 10, 'sheets');

-- Heatwave (ID: 12)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(12, 'Portable Fans', 'Battery-powered fans for cooling', 1, 'per person'),
(12, 'Cooling Towels', 'Special fabric that stays cool when wet', 2, 'per person'),
(12, 'Blackout Curtains', 'To block heat from sunlight', 1, 'per window'),
(12, 'Electrolyte Packets', 'To replace minerals lost through sweating', 20, 'packets'),
(12, 'Spray Bottles', 'For misting with water to cool down', 1, 'per person'),
(12, 'Ice Packs', 'Refreezable packs for cooling body temperature', 4, 'packs'),
(12, 'Wide-Brimmed Hats', 'For sun protection', 1, 'per person'),
(12, 'Sunscreen', 'SPF 30+ for sun protection', 2, 'bottles');

-- Industrial Accident (ID: 19)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(19, 'Multi-Gas Detector', 'For detecting hazardous gases', 1, 'detector'),
(19, 'Emergency Escape Respirator', 'For breathing protection during evacuation', 1, 'per person'),
(19, 'Chemical-Resistant Clothing', 'Full body protection', 1, 'set per person'),
(19, 'Evacuation Map', 'With multiple exit routes marked', 1, 'map'),
(19, 'Emergency Contact List', 'Including poison control and chemical response teams', 1, 'list'),
(19, 'Safety Goggles', 'Sealed eye protection', 1, 'per person'),
(19, 'First Aid Kit with Burn Treatments', 'Specialized for industrial injuries', 1, 'kit'),
(19, 'Emergency Shower Kit', 'Portable decontamination system', 1, 'kit');

-- Landslide (ID: 9)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(9, 'Geologic Hazard Map', 'Shows landslide-prone areas', 1, 'map'),
(9, 'Sandbags', 'For diverting water flow', 20, 'bags'),
(9, 'Plastic Sheeting', 'For covering slopes to prevent water infiltration', 2, 'rolls'),
(9, 'Collapsible Shovel', 'For emergency digging', 1, 'shovel'),
(9, 'Rope', 'Heavy-duty rope for securing items or rescue', 100, 'feet'),
(9, 'Hard Hat', 'Protection from falling debris', 1, 'per person'),
(9, 'Drainage Tools', 'For redirecting water away from slopes', 1, 'set'),
(9, 'Erosion Control Materials', 'For stabilizing soil', 10, 'square meters');

-- Nuclear Disaster (ID: 16)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(16, 'Potassium Iodide Tablets', 'Protects thyroid from radioactive iodine', 14, 'tablets per person'),
(16, 'Radiation Detector', 'Personal radiation monitoring device', 1, 'detector'),
(16, 'Plastic Sheeting', 'For sealing rooms against fallout', 3, 'rolls'),
(16, 'Duct Tape', 'For sealing plastic sheeting', 3, 'rolls'),
(16, 'N95 Respirators', 'For filtering radioactive particles', 10, 'per person'),
(16, 'Protective Clothing', 'Full body coverage to prevent contamination', 1, 'set per person'),
(16, 'Decontamination Supplies', 'Soap, brushes, and bags for removing contamination', 1, 'kit'),
(16, 'Radiation Emergency Maps', 'Showing evacuation routes and shelters', 1, 'map');

-- Oil Spill (ID: 17)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(17, 'Oil-Absorbing Booms', 'Floating barriers to contain oil', 50, 'feet'),
(17, 'Oil-Absorbing Pads', 'For soaking up small amounts of oil', 100, 'pads'),
(17, 'Chemical-Resistant Gloves', 'For handling contaminated materials', 5, 'pairs'),
(17, 'Safety Goggles', 'Eye protection from oil splashes', 1, 'per person'),
(17, 'Protective Clothing', 'Oil-resistant coveralls', 2, 'sets per person'),
(17, 'Breathing Protection', 'Respirator rated for organic vapors', 1, 'per person'),
(17, 'Heavy-Duty Bags', 'For containing contaminated materials', 20, 'bags'),
(17, 'Biodegradable Detergent', 'For cleaning oil from surfaces', 2, 'gallons');

-- Radiological Accident (ID: 29)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(29, 'Potassium Iodide Tablets', 'Protects thyroid from radioactive iodine', 14, 'tablets per person'),
(29, 'Radiation Monitoring Badges', 'Personal radiation dose indicators', 1, 'per person'),
(29, 'Heavy-Duty Plastic Bags', 'For containing contaminated clothing', 20, 'bags'),
(29, 'HEPA Filter Masks', 'For filtering radioactive particles', 5, 'per person'),
(29, 'Protective Coveralls', 'Full body protection', 2, 'per person'),
(29, 'Radiation Detector', 'For monitoring radiation levels', 1, 'detector'),
(29, 'Water Filtration System', 'Rated for radiological contaminants', 1, 'system'),
(29, 'Emergency Radio', 'For instructions from authorities', 1, 'radio');

-- Water Pollution Disaster (ID: 21)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(21, 'Water Test Kits', 'For checking water contamination', 5, 'kits'),
(21, 'Water Filtration System', 'Multi-stage filtration for contaminants', 1, 'system'),
(21, 'Activated Carbon Filters', 'For removing chemicals from water', 5, 'filters'),
(21, 'Water Purification Tablets', 'For disinfecting water', 100, 'tablets'),
(21, 'Distillation Equipment', 'For removing heavy metals and chemicals', 1, 'set'),
(21, 'Emergency Water Containers', 'For storing clean water', 5, 'containers'),
(21, 'Water-Safe Indicator Strips', 'Quick tests for common contaminants', 50, 'strips'),
(21, 'Rainwater Collection System', 'Alternative water source', 1, 'system');

-- War/Armed Conflict (ID: 26)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(26, 'Emergency Passport Holder', 'Waterproof container for important documents', 1, 'per person'),
(26, 'Copies of Identification', 'Backup copies of all ID documents', 2, 'sets'),
(26, 'Emergency Cash', 'In small denominations and multiple currencies', 1000, 'dollars equivalent'),
(26, 'Portable Ham Radio', 'For communication when networks are down', 1, 'radio'),
(26, 'High-Calorie Emergency Food', 'Compact, long-lasting food supply', 14, 'days worth'),
(26, 'Personal Security Devices', 'Non-lethal protection', 1, 'per person'),
(26, 'Blackout Materials', 'For covering windows', 1, 'set per window'),
(26, 'Emergency Evacuation Plan', 'With multiple routes and rally points', 1, 'plan');

-- Volcanic Eruption (ID: 3)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(3, 'N95 Respirators', 'For protection from ash', 10, 'per person'),
(3, 'Goggles', 'Sealed eye protection from ash and gases', 1, 'per person'),
(3, 'Plastic Sheeting', 'For sealing windows and doors', 2, 'rolls'),
(3, 'Ash Removal Tools', 'Brooms, shovels, and heavy-duty bags', 1, 'set'),
(3, 'Battery-Powered Air Purifier', 'For filtering ash from indoor air', 1, 'per room'),
(3, 'Hard Hats', 'Protection from falling debris', 1, 'per person'),
(3, 'Long-Sleeved Clothing', 'Full body coverage for ash protection', 2, 'sets per person'),
(3, 'Gas Masks', 'With volcanic gas filters for toxic environments', 1, 'per person');

-- Transport Accident (ID: 25)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(25, 'Roadside Emergency Kit', 'Basic tools and supplies for vehicle breakdowns', 1, 'kit per vehicle'),
(25, 'Reflective Triangles', 'For marking accident location', 3, 'triangles'),
(25, 'Seatbelt Cutter/Window Breaker', 'For emergency vehicle escape', 1, 'per vehicle'),
(25, 'Fire Extinguisher', 'Rated for vehicle fires', 1, 'per vehicle'),
(25, 'Emergency Contact Card', 'With medical information and contacts', 1, 'per person'),
(25, 'First Aid Kit', 'Comprehensive for accident injuries', 1, 'kit'),
(25, 'Reflective Vests', 'For visibility when outside vehicle', 1, 'per person'),
(25, 'Waterproof Document Case', 'For vehicle registration and insurance', 1, 'case');

-- Tornado (ID: 5)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(5, 'Weather Radio', 'NOAA radio with alert function', 1, 'radio'),
(5, 'Helmet', 'Protection from falling debris', 1, 'per person'),
(5, 'Sturdy Shoes', 'For walking through debris', 1, 'pair per person'),
(5, 'Work Gloves', 'Heavy-duty protection for handling debris', 1, 'pair per person'),
(5, 'Emergency Blankets', 'Compact, thermal protection', 1, 'per person'),
(5, 'Whistle', 'For signaling if trapped in debris', 1, 'per person'),
(5, 'Shelter Location Map', 'Showing nearest tornado shelters', 1, 'map'),
(5, 'Plywood Sheets', 'For boarding up windows', 10, 'sheets');

-- Soil Contamination (ID: 22)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(22, 'Soil Testing Kits', 'For identifying contaminants', 5, 'kits'),
(22, 'Garden Gloves', 'Protection when handling soil', 2, 'pairs per person'),
(22, 'Raised Garden Beds', 'For growing food above contaminated soil', 4, 'beds'),
(22, 'Clean Topsoil', 'For covering or replacing contaminated soil', 20, 'cubic feet'),
(22, 'Water Filters', 'For filtering potentially contaminated groundwater', 2, 'filters'),
(22, 'Soil Amendment Materials', 'For remediating contaminated soil', 100, 'pounds'),
(22, 'Dust Masks', 'For protection when working with dry soil', 20, 'masks'),
(22, 'Boot Covers', 'To prevent tracking contamination', 20, 'pairs');

-- Sandstorm/Dust Storm (ID: 15)
INSERT INTO public.prepare_template_items (category_id, name, description, recommended_quantity, unit) VALUES
(15, 'N95 Respirators', 'For filtering dust particles', 10, 'per person'),
(15, 'Goggles', 'Sealed eye protection from dust', 1, 'per person'),
(15, 'Scarves or Bandanas', 'For covering face in emergency', 2, 'per person'),
(15, 'Air Purifiers', 'HEPA filtration for indoor air', 1, 'per room'),
(15, 'Door and Window Seals', 'For preventing dust infiltration', 1, 'set per opening'),
(15, 'Car Air Filter Replacements', 'Spare filters for vehicles', 2, 'filters per vehicle'),
(15, 'Moisturizing Eye Drops', 'For treating dust irritation', 2, 'bottles'),
(15, 'Water Bottles with Dust Covers', 'Protected drinking water', 1, 'per person'); 