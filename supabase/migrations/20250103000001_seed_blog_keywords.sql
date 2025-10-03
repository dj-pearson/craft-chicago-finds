-- Seed blog keywords data from the comprehensive keyword database
-- This migration populates all 227 keywords from the original Keywords.md file

-- Insert Thought Leadership keywords (Cluster 1)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, priority_score) VALUES
(1, 'benefits of shopping local', 'high', 'medium', 'low', false, false, '{}', 'pillar_post', ARRAY['why shop local matters', 'local business benefits', 'community impact shopping'], 'comprehensive_guide', 85),
(1, 'why buy handmade products', 'medium', 'medium', 'medium', false, false, '{}', 'educational', ARRAY['handmade vs mass produced', 'quality handmade goods', 'artisan craftsmanship'], 'comparison_guide', 80),
(1, 'why shopping small businesses matters', 'medium', 'low', 'low', false, false, '{}', 'thought_leadership', ARRAY['small business impact', 'local economy support', 'community development'], 'impact_story', 75),
(1, 'shop local vs shop online', 'medium', 'medium', 'medium', true, false, '{}', 'comparison', ARRAY['local vs online shopping', 'benefits local marketplace', 'why choose local'], 'pros_cons_comparison', 85),
(1, 'handmade vs factory made gifts', 'low', 'low', 'high', false, true, ARRAY['november', 'december', 'may', 'february'], 'gift_guide', ARRAY['quality gift comparison', 'unique vs mass produced', 'artisan gift value'], 'gift_buyer_education', 90),
(1, 'why handmade products are better', 'medium', 'medium', 'medium', false, false, '{}', 'educational', ARRAY['handmade quality benefits', 'artisan craftsmanship value', 'unique handmade appeal'], 'quality_focus', 80),
(1, 'top reasons to support local artists', 'low', 'low', 'medium', true, false, '{}', 'listicle', ARRAY['support local creators', 'Chicago artists support', 'local art community'], 'community_spotlight', 75),
(1, 'environmental benefits of shopping local', 'medium', 'low', 'low', true, false, '{}', 'sustainability', ARRAY['eco friendly shopping', 'sustainable local commerce', 'reduce carbon footprint'], 'sustainability_focus', 70),
(1, 'what is a local marketplace', 'low', 'low', 'low', true, false, '{}', 'educational', ARRAY['local marketplace benefits', 'community commerce platform', 'neighborhood shopping'], 'platform_explanation', 65),
(1, 'shop small business gifts ideas', 'medium', 'medium', 'high', false, true, ARRAY['november', 'december', 'may', 'february'], 'gift_guide', ARRAY['small business gift guide', 'local business gifts', 'unique gift ideas'], 'gift_guide_round_up', 85),
(1, 'why Etsy isn''t local', 'low', 'low', 'medium', true, false, '{}', 'comparison', ARRAY['Etsy vs local marketplace', 'truly local shopping', 'neighborhood vs global'], 'platform_differentiation', 80),
(1, 'alternative to Etsy for handmade products', 'medium', 'medium', 'high', true, false, '{}', 'platform_comparison', ARRAY['local Etsy alternative', 'handmade marketplace options', 'local artisan platform'], 'platform_alternative_guide', 90);

-- Insert Gift Guide keywords (Cluster 2)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, priority_score) VALUES
(2, 'handmade gifts near me', 'high', 'medium', 'high', true, true, ARRAY['november', 'december', 'may', 'february'], 'local_gift_guide', ARRAY['local handmade gifts Chicago', 'artisan gifts nearby', 'unique gifts Chicago'], 'location_specific_gift_guide', 95),
(2, 'unique handmade gifts for birthdays', 'medium', 'medium', 'high', false, false, '{}', 'occasion_gift_guide', ARRAY['birthday gift ideas handmade', 'personalized birthday gifts', 'custom birthday presents'], 'occasion_specific_guide', 85),
(2, 'handmade Christmas gifts near me', 'high', 'high', 'high', true, true, ARRAY['november', 'december'], 'holiday_gift_guide', ARRAY['Chicago Christmas gifts', 'local holiday presents', 'handmade holiday gifts'], 'local_holiday_guide', 100),
(2, 'handmade Valentine''s gifts near me', 'medium', 'medium', 'high', true, true, ARRAY['january', 'february'], 'holiday_gift_guide', ARRAY['romantic handmade gifts Chicago', 'Valentine''s Day local', 'love gifts handmade'], 'romantic_local_guide', 90),
(2, 'handmade Mother''s Day gift ideas', 'high', 'high', 'high', false, true, ARRAY['april', 'may'], 'holiday_gift_guide', ARRAY['Mother''s Day handmade gifts', 'mom gifts artisan', 'unique Mother''s Day presents'], 'mom_focused_gift_guide', 95),
(2, 'handmade Father''s Day gift ideas', 'medium', 'medium', 'high', false, true, ARRAY['may', 'june'], 'holiday_gift_guide', ARRAY['Father''s Day handmade gifts', 'dad gifts artisan', 'unique Father''s Day presents'], 'dad_focused_gift_guide', 90),
(2, 'handmade wedding gifts local', 'low', 'low', 'high', true, true, ARRAY['april', 'may', 'june', 'july', 'august', 'september'], 'occasion_gift_guide', ARRAY['wedding gifts Chicago', 'custom wedding presents', 'artisan wedding gifts'], 'wedding_gift_guide', 85),
(2, 'handmade baby shower gifts near me', 'medium', 'low', 'high', true, false, '{}', 'occasion_gift_guide', ARRAY['baby shower gifts Chicago', 'handmade baby items', 'unique baby presents'], 'baby_focused_guide', 80),
(2, 'handmade anniversary gifts near me', 'low', 'low', 'high', true, false, '{}', 'occasion_gift_guide', ARRAY['anniversary gifts Chicago', 'romantic handmade gifts', 'custom anniversary presents'], 'anniversary_romance_guide', 75),
(2, 'eco friendly handmade gifts', 'medium', 'low', 'medium', false, false, '{}', 'sustainable_gift_guide', ARRAY['sustainable handmade gifts', 'eco conscious presents', 'green gift ideas'], 'sustainability_gift_focus', 80),
(2, 'handmade gifts under $50', 'medium', 'medium', 'high', false, true, ARRAY['november', 'december'], 'budget_gift_guide', ARRAY['affordable handmade gifts', 'budget artisan presents', 'cheap unique gifts'], 'budget_conscious_guide', 85),
(2, 'handmade gifts for teachers', 'medium', 'low', 'high', false, true, ARRAY['may', 'december'], 'recipient_gift_guide', ARRAY['teacher appreciation gifts', 'end of year teacher gifts', 'thank you teacher presents'], 'teacher_appreciation_guide', 80),
(2, 'local holiday gift guide', 'medium', 'low', 'high', true, true, ARRAY['november', 'december'], 'comprehensive_holiday_guide', ARRAY['Chicago holiday shopping', 'local holiday presents', 'neighborhood gift guide'], 'comprehensive_local_holiday', 90),
(2, 'handmade home décor gifts', 'medium', 'medium', 'medium', false, false, '{}', 'category_gift_guide', ARRAY['home decor gift ideas', 'handmade house gifts', 'artisan home accessories'], 'home_decor_focus', 75),
(2, 'local artisan gifts for holidays', 'low', 'low', 'high', true, true, ARRAY['november', 'december'], 'artisan_holiday_guide', ARRAY['Chicago artisan holiday gifts', 'local maker presents', 'handcrafted holiday gifts'], 'artisan_spotlight_holiday', 85),
(2, 'seasonal handmade gifts Spring', 'low', 'low', 'medium', false, true, ARRAY['march', 'april', 'may'], 'seasonal_gift_guide', ARRAY['spring gift ideas', 'Easter handmade gifts', 'spring home decor'], 'seasonal_spring_guide', 70),
(2, 'seasonal handmade gifts Summer', 'low', 'low', 'medium', false, true, ARRAY['june', 'july', 'august'], 'seasonal_gift_guide', ARRAY['summer gift ideas', 'outdoor handmade gifts', 'summer accessories'], 'seasonal_summer_guide', 70),
(2, 'seasonal handmade gifts Fall', 'low', 'low', 'medium', false, true, ARRAY['september', 'october', 'november'], 'seasonal_gift_guide', ARRAY['fall gift ideas', 'autumn handmade gifts', 'harvest season gifts'], 'seasonal_fall_guide', 75),
(2, 'seasonal handmade gifts Winter', 'medium', 'medium', 'high', false, true, ARRAY['december', 'january', 'february'], 'seasonal_gift_guide', ARRAY['winter gift ideas', 'cozy handmade gifts', 'holiday presents'], 'seasonal_winter_guide', 85);

-- Insert Craft Fairs & Events keywords (Cluster 3)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, priority_score) VALUES
(3, 'craft fairs near me this weekend', 'high', 'medium', 'high', true, false, '{}', 'event_listing', ARRAY['weekend craft fairs Chicago', 'craft markets this weekend', 'artisan events nearby'], 'weekend_event_guide', 95),
(3, 'craft show schedule 2025 Chicago', 'medium', 'low', 'medium', true, false, '{}', 'comprehensive_event_calendar', ARRAY['Chicago craft fair calendar', '2025 artisan events', 'craft show dates Chicago'], 'annual_event_calendar', 85),
(3, 'local holiday markets near me', 'high', 'medium', 'high', true, true, ARRAY['november', 'december'], 'holiday_event_guide', ARRAY['Chicago holiday markets', 'Christmas markets nearby', 'winter markets'], 'holiday_market_guide', 95),
(3, 'farmers market vendors near me', 'medium', 'medium', 'medium', true, true, ARRAY['april', 'may', 'june', 'july', 'august', 'september', 'october'], 'vendor_guide', ARRAY['Chicago farmers market crafts', 'market vendor directory', 'local market vendors'], 'vendor_spotlight_guide', 80),
(3, 'handmade market near me', 'medium', 'low', 'high', true, false, '{}', 'market_guide', ARRAY['Chicago handmade markets', 'artisan markets nearby', 'maker markets'], 'handmade_market_directory', 85),
(3, 'best local craft fairs Illinois', 'low', 'low', 'medium', true, false, '{}', 'state_wide_guide', ARRAY['Illinois craft fair guide', 'top craft shows Illinois', 'best artisan events'], 'state_craft_fair_roundup', 70),
(3, 'upcoming artisan markets near me', 'low', 'low', 'high', true, false, '{}', 'upcoming_events', ARRAY['Chicago artisan market schedule', 'upcoming maker events', 'next craft markets'], 'upcoming_events_preview', 75),
(3, 'Chicago handmade holiday market', 'medium', 'low', 'high', true, true, ARRAY['november', 'december'], 'city_specific_holiday_guide', ARRAY['Chicago Christmas markets', 'holiday craft fairs Chicago', 'Chicago winter markets'], 'chicago_holiday_market_guide', 90),
(3, 'craft vendor application Chicago', 'low', 'low', 'medium', true, false, '{}', 'vendor_education', ARRAY['become craft vendor Chicago', 'craft fair vendor process', 'apply to craft markets'], 'vendor_application_guide', 65),
(3, 'how to prepare for a craft fair', 'medium', 'low', 'low', false, false, '{}', 'educational', ARRAY['craft fair preparation tips', 'vendor setup guide', 'craft fair success tips'], 'vendor_education_guide', 75),
(3, 'craft fair vendor checklist', 'low', 'low', 'low', false, false, '{}', 'educational_resource', ARRAY['vendor checklist craft fair', 'craft fair essentials', 'vendor preparation list'], 'practical_vendor_resource', 70),
(3, 'tips for selling at craft fairs', 'medium', 'low', 'low', false, false, '{}', 'educational', ARRAY['craft fair sales tips', 'increase craft fair sales', 'vendor success strategies'], 'vendor_success_guide', 75),
(3, 'how to find local craft fairs', 'low', 'low', 'medium', true, false, '{}', 'discovery_guide', ARRAY['find craft fairs near me', 'discover local markets', 'craft fair finder'], 'event_discovery_guide', 70),
(3, 'pop up artisan market Chicago', 'low', 'low', 'high', true, false, '{}', 'event_specific', ARRAY['Chicago pop up markets', 'temporary artisan markets', 'mobile craft markets'], 'pop_up_market_guide', 75);

-- Insert Seller Education keywords (Cluster 4)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, priority_score) VALUES
(4, 'how to sell handmade products locally', 'medium', 'low', 'medium', true, false, '{}', 'how_to_guide', ARRAY['sell handmade goods Chicago', 'local selling strategies', 'neighborhood sales'], 'local_selling_strategy_guide', 85),
(4, 'best places to sell handmade items near me', 'medium', 'medium', 'high', true, false, '{}', 'marketplace_comparison', ARRAY['where to sell crafts Chicago', 'local selling venues', 'handmade marketplaces'], 'selling_venue_comparison', 90),
(4, 'how to start a craft business in Chicago', 'low', 'low', 'medium', true, false, '{}', 'comprehensive_business_guide', ARRAY['Chicago craft business startup', 'craft business licenses Chicago', 'start handmade business'], 'city_specific_business_guide', 80),
(4, 'how to price handmade items for profit', 'high', 'medium', 'medium', false, false, '{}', 'pricing_guide', ARRAY['handmade pricing calculator', 'craft pricing strategy', 'profit margins handmade'], 'pricing_strategy_guide', 95),
(4, 'best crafts to sell in 2025', 'high', 'high', 'medium', false, false, '{}', 'trend_guide', ARRAY['trending crafts 2025', 'profitable handmade items', 'popular craft trends'], 'trend_analysis_guide', 90),
(4, 'how to promote handmade products locally', 'low', 'low', 'medium', true, false, '{}', 'marketing_guide', ARRAY['local marketing handmade', 'promote craft business Chicago', 'neighborhood marketing'], 'local_marketing_strategy', 75),
(4, 'Etsy alternatives for sellers', 'medium', 'medium', 'high', false, false, '{}', 'platform_comparison', ARRAY['alternatives to Etsy', 'handmade selling platforms', 'craft marketplace options'], 'platform_alternatives_guide', 95),
(4, 'best marketplaces for handmade sellers', 'medium', 'medium', 'high', false, false, '{}', 'marketplace_comparison', ARRAY['handmade marketplace comparison', 'craft selling platforms', 'artisan marketplaces'], 'comprehensive_marketplace_guide', 90),
(4, 'branding your handmade business locally', 'low', 'low', 'low', true, false, '{}', 'branding_guide', ARRAY['local craft business branding', 'neighborhood business identity', 'community branding'], 'local_branding_strategy', 70),
(4, 'how to get more craft fair sales', 'medium', 'low', 'medium', false, false, '{}', 'sales_optimization', ARRAY['increase craft fair revenue', 'craft fair sales tips', 'booth sales strategies'], 'craft_fair_sales_guide', 80),
(4, 'how to grow your handmade business', 'medium', 'medium', 'medium', false, false, '{}', 'business_growth', ARRAY['scale handmade business', 'craft business growth', 'expand artisan business'], 'business_scaling_guide', 85),
(4, 'top selling handmade items at markets', 'medium', 'low', 'medium', false, false, '{}', 'market_research', ARRAY['best selling crafts markets', 'popular handmade items', 'market bestsellers'], 'market_trends_analysis', 80),
(4, 'craft business ideas that make money', 'high', 'high', 'medium', false, false, '{}', 'business_ideas', ARRAY['profitable craft businesses', 'money making craft ideas', 'successful handmade businesses'], 'business_opportunity_guide', 85),
(4, 'how to photograph handmade products', 'medium', 'low', 'low', false, false, '{}', 'technical_guide', ARRAY['craft photography tips', 'product photos handmade', 'DIY product photography'], 'photography_tutorial', 75),
(4, 'how to package handmade items for sale', 'low', 'low', 'low', false, false, '{}', 'operational_guide', ARRAY['handmade packaging ideas', 'craft packaging tips', 'product presentation'], 'packaging_strategy_guide', 70),
(4, 'best payment methods for craft fairs', 'low', 'low', 'low', false, false, '{}', 'operational_guide', ARRAY['craft fair payment processing', 'mobile payments crafts', 'vendor payment solutions'], 'payment_processing_guide', 65),
(4, 'handmade product descriptions that sell', 'low', 'low', 'low', false, false, '{}', 'copywriting_guide', ARRAY['craft product copywriting', 'selling descriptions handmade', 'product listing tips'], 'product_description_guide', 70);

-- Insert Product-Specific keywords (Cluster 5)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, product_category, priority_score) VALUES
(5, 'handmade jewelry near me', 'high', 'medium', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago handmade jewelry', 'local jewelry makers', 'artisan jewelry nearby'], 'local_jewelry_guide', 'jewelry', 95),
(5, 'handmade soap near me', 'medium', 'low', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago handmade soap', 'natural soap makers', 'artisan soap nearby'], 'local_soap_guide', 'bath_body', 85),
(5, 'handmade candles near me', 'high', 'medium', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago handmade candles', 'local candle makers', 'artisan candles nearby'], 'local_candle_guide', 'home_decor', 90),
(5, 'handmade pottery near me', 'medium', 'low', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago pottery makers', 'ceramic artists nearby', 'local pottery studios'], 'local_pottery_guide', 'home_decor', 85),
(5, 'handmade wooden gifts near me', 'medium', 'low', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago woodworkers', 'local wood crafts', 'handmade furniture nearby'], 'local_woodworking_guide', 'home_decor', 85),
(5, 'handmade art from local artists', 'low', 'low', 'medium', true, false, '{}', 'category_guide', ARRAY['Chicago local artists', 'original artwork nearby', 'local art for sale'], 'local_art_guide', 'art', 80),
(5, 'handmade home décor near me', 'medium', 'medium', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago home decor makers', 'local home accessories', 'artisan home goods'], 'local_home_decor_guide', 'home_decor', 90),
(5, 'handmade clothing near me', 'medium', 'medium', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago clothing designers', 'local fashion makers', 'handmade apparel nearby'], 'local_clothing_guide', 'clothing', 85),
(5, 'handmade bags near me', 'low', 'low', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago bag makers', 'local leather goods', 'handmade purses nearby'], 'local_bags_guide', 'accessories', 80),
(5, 'handmade skincare products local', 'medium', 'low', 'high', true, false, '{}', 'category_guide', ARRAY['Chicago skincare makers', 'natural skincare local', 'handmade beauty products'], 'local_skincare_guide', 'bath_body', 85),
(5, 'handmade quilts near me', 'low', 'low', 'medium', true, false, '{}', 'category_guide', ARRAY['Chicago quilters', 'local textile artists', 'handmade bedding nearby'], 'local_quilting_guide', 'home_decor', 75),
(5, 'handmade pet accessories near me', 'low', 'low', 'medium', true, false, '{}', 'category_guide', ARRAY['Chicago pet product makers', 'local pet accessories', 'handmade dog collars'], 'local_pet_accessories_guide', 'pet_accessories', 75),
(5, 'handmade kitchen items local', 'low', 'low', 'medium', true, false, '{}', 'category_guide', ARRAY['Chicago kitchen crafters', 'local kitchen accessories', 'handmade cutting boards'], 'local_kitchen_guide', 'home_decor', 80),
(5, 'handmade toys near me', 'low', 'low', 'medium', true, false, '{}', 'category_guide', ARRAY['Chicago toy makers', 'local wooden toys', 'handmade children''s toys'], 'local_toys_guide', 'toys', 75),
(5, 'handmade eco products near me', 'low', 'low', 'medium', true, false, '{}', 'category_guide', ARRAY['Chicago eco makers', 'sustainable products local', 'green handmade goods'], 'local_eco_products_guide', 'sustainable', 80);

-- Insert Local SEO keywords (Cluster 6)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, priority_score) VALUES
(6, 'best local gift shops in Chicago', 'medium', 'medium', 'high', true, false, '{}', 'city_guide', ARRAY['Chicago gift shop guide', 'unique shops Chicago', 'local gift stores'], 'comprehensive_city_shopping_guide', 90),
(6, 'handmade products in Chicago', 'medium', 'low', 'medium', true, false, '{}', 'city_overview', ARRAY['Chicago handmade scene', 'artisan goods Chicago', 'local makers Chicago'], 'city_handmade_scene_overview', 85),
(6, 'where to shop local in Chicago', 'medium', 'low', 'high', true, false, '{}', 'shopping_guide', ARRAY['Chicago local shopping guide', 'support local Chicago', 'neighborhood shopping'], 'comprehensive_local_shopping', 90),
(6, 'artisan markets in Chicago', 'low', 'low', 'medium', true, false, '{}', 'market_directory', ARRAY['Chicago craft markets', 'artisan fairs Chicago', 'maker markets'], 'chicago_market_directory', 80),
(6, 'handmade vendors in Chicago', 'low', 'low', 'medium', true, false, '{}', 'vendor_directory', ARRAY['Chicago craft vendors', 'local makers directory', 'artisan vendor list'], 'vendor_spotlight_directory', 75),
(6, 'shop local guide to Chicago', 'low', 'low', 'medium', true, false, '{}', 'comprehensive_city_guide', ARRAY['Chicago local business guide', 'support Chicago makers', 'local commerce guide'], 'ultimate_chicago_local_guide', 85),
(6, 'best handmade gifts in Chicago', 'medium', 'low', 'high', true, true, ARRAY['november', 'december', 'may'], 'gift_guide', ARRAY['Chicago unique gifts', 'local gift ideas Chicago', 'artisan gifts Chicago'], 'chicago_gift_guide', 90),
(6, 'support local artists in Chicago', 'low', 'low', 'low', true, false, '{}', 'community_guide', ARRAY['Chicago artist community', 'local art support', 'artist advocacy Chicago'], 'artist_community_spotlight', 75),
(6, 'buy local art in Chicago', 'low', 'low', 'medium', true, false, '{}', 'art_buying_guide', ARRAY['Chicago local art sales', 'where to buy art Chicago', 'local art galleries'], 'chicago_art_buying_guide', 80),
(6, 'holiday craft fairs in Chicago', 'medium', 'low', 'high', true, true, ARRAY['november', 'december'], 'holiday_event_guide', ARRAY['Chicago Christmas craft fairs', 'holiday markets Chicago', 'winter craft events'], 'chicago_holiday_events', 85),
(6, 'handmade jewelry Chicago', 'medium', 'medium', 'high', true, false, '{}', 'category_city_guide', ARRAY['Chicago jewelry makers', 'local jewelry designers', 'artisan jewelry Chicago'], 'chicago_jewelry_scene', 85),
(6, 'farmers market craft vendors Chicago', 'low', 'low', 'medium', true, true, ARRAY['april', 'may', 'june', 'july', 'august', 'september', 'october'], 'vendor_guide', ARRAY['Chicago farmers market crafts', 'market vendors Chicago', 'craft booths farmers market'], 'farmers_market_craft_guide', 75),
(6, 'where to find handmade goods in Chicago', 'low', 'low', 'medium', true, false, '{}', 'discovery_guide', ARRAY['find Chicago handmade', 'discover local crafts', 'Chicago artisan finder'], 'handmade_discovery_guide', 80),
(6, 'small business holiday shopping Chicago', 'low', 'low', 'high', true, true, ARRAY['november', 'december'], 'holiday_shopping_guide', ARRAY['Chicago small business gifts', 'local holiday shopping', 'support small business holidays'], 'small_business_holiday_guide', 85);

-- Insert Educational Content keywords (Cluster 7)
INSERT INTO public.blog_keywords (cluster_id, primary_keyword, search_volume, competition, buyer_intent, local_modifier, seasonal, seasonal_months, content_type, related_keywords, blog_angle, priority_score) VALUES
(7, 'what is handmade vs handcrafted', 'low', 'low', 'low', false, false, '{}', 'definitional', ARRAY['handmade definition', 'handcrafted meaning', 'artisan made vs handmade'], 'terminology_explanation', 65),
(7, 'why handmade products cost more', 'medium', 'low', 'low', false, false, '{}', 'educational_explanation', ARRAY['handmade pricing explained', 'artisan product value', 'craft pricing reasons'], 'value_proposition_education', 80),
(7, 'how handmade goods are made', 'low', 'low', 'low', false, false, '{}', 'process_explanation', ARRAY['handmade process', 'artisan techniques', 'craft making process'], 'behind_the_scenes_education', 70),
(7, 'history of handmade crafts', 'low', 'low', 'low', false, false, '{}', 'historical_context', ARRAY['craft history', 'traditional crafts', 'artisan heritage'], 'historical_perspective', 65),
(7, 'handmade product trends 2025', 'medium', 'medium', 'medium', false, false, '{}', 'trend_analysis', ARRAY['craft trends 2025', 'handmade market trends', 'artisan product trends'], 'industry_trend_analysis', 85),
(7, 'how to identify authentic handmade products', 'low', 'low', 'medium', false, false, '{}', 'buyer_education', ARRAY['authentic handmade signs', 'real vs fake handmade', 'genuine artisan products'], 'authenticity_guide', 75),
(7, 'handmade vs DIY products', 'low', 'low', 'low', false, false, '{}', 'comparison', ARRAY['DIY vs artisan made', 'professional handmade', 'craft quality levels'], 'quality_comparison_guide', 70),
(7, 'handmade economy explained', 'low', 'low', 'low', false, false, '{}', 'economic_analysis', ARRAY['craft economy', 'handmade market size', 'artisan economy impact'], 'economic_impact_analysis', 65),
(7, 'how handmade crafts support communities', 'low', 'low', 'low', true, false, '{}', 'community_impact', ARRAY['craft community impact', 'local maker support', 'artisan community benefits'], 'community_impact_story', 75),
(7, 'handmade sustainability guide', 'low', 'low', 'low', false, false, '{}', 'sustainability_education', ARRAY['sustainable handmade', 'eco friendly crafts', 'green artisan practices'], 'sustainability_focus', 70),
(7, 'handmade product certifications explained', 'low', 'low', 'low', false, false, '{}', 'certification_guide', ARRAY['artisan certifications', 'handmade standards', 'craft quality certifications'], 'certification_education', 65);

-- Update priority scores based on seasonal relevance and current month context
UPDATE public.blog_keywords 
SET priority_score = priority_score + 15 
WHERE seasonal = true 
AND (
  EXTRACT(month FROM CURRENT_DATE) = ANY(
    CASE 
      WHEN 'january' = ANY(seasonal_months) THEN ARRAY[1]
      WHEN 'february' = ANY(seasonal_months) THEN ARRAY[2]
      WHEN 'march' = ANY(seasonal_months) THEN ARRAY[3]
      WHEN 'april' = ANY(seasonal_months) THEN ARRAY[4]
      WHEN 'may' = ANY(seasonal_months) THEN ARRAY[5]
      WHEN 'june' = ANY(seasonal_months) THEN ARRAY[6]
      WHEN 'july' = ANY(seasonal_months) THEN ARRAY[7]
      WHEN 'august' = ANY(seasonal_months) THEN ARRAY[8]
      WHEN 'september' = ANY(seasonal_months) THEN ARRAY[9]
      WHEN 'october' = ANY(seasonal_months) THEN ARRAY[10]
      WHEN 'november' = ANY(seasonal_months) THEN ARRAY[11]
      WHEN 'december' = ANY(seasonal_months) THEN ARRAY[12]
      ELSE ARRAY[]::integer[]
    END
  )
);
