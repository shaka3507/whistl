-- Create prepare tables for emergency preparedness feature

-- Categories of emergencies (earthquake, flood, etc.)
CREATE TABLE IF NOT EXISTS public.prepare_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Template items that are recommended for each category
CREATE TABLE IF NOT EXISTS public.prepare_template_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.prepare_categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    recommended_quantity INTEGER DEFAULT 1,
    unit TEXT DEFAULT 'item',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-created preparation lists
CREATE TABLE IF NOT EXISTS public.prepare_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES public.prepare_categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items in user-created preparation lists
CREATE TABLE IF NOT EXISTS public.prepare_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES public.prepare_lists(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT DEFAULT 'item',
    is_acquired BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row-level security policies
ALTER TABLE public.prepare_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepare_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepare_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepare_list_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories and template items
CREATE POLICY "Anyone can read prepare_categories" 
    ON public.prepare_categories FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can read prepare_template_items" 
    ON public.prepare_template_items FOR SELECT 
    USING (true);

-- Only admins can modify categories and template items
CREATE POLICY "Only admins can insert prepare_categories" 
    ON public.prepare_categories FOR INSERT 
    WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update prepare_categories" 
    ON public.prepare_categories FOR UPDATE 
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete prepare_categories" 
    ON public.prepare_categories FOR DELETE 
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can insert prepare_template_items" 
    ON public.prepare_template_items FOR INSERT 
    WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update prepare_template_items" 
    ON public.prepare_template_items FOR UPDATE 
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete prepare_template_items" 
    ON public.prepare_template_items FOR DELETE 
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Users can read their own prepare lists and items
CREATE POLICY "Users can read their own prepare_lists" 
    ON public.prepare_lists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own prepare_list_items" 
    ON public.prepare_list_items FOR SELECT 
    USING (auth.uid() IN (
        SELECT user_id FROM public.prepare_lists WHERE id = list_id
    ));

-- Users can create, update, and delete their own prepare lists
CREATE POLICY "Users can insert their own prepare_lists" 
    ON public.prepare_lists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prepare_lists" 
    ON public.prepare_lists FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prepare_lists" 
    ON public.prepare_lists FOR DELETE 
    USING (auth.uid() = user_id);

-- Users can create, update, and delete their own prepare list items
CREATE POLICY "Users can insert their own prepare_list_items" 
    ON public.prepare_list_items FOR INSERT 
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.prepare_lists WHERE id = list_id
    ));

CREATE POLICY "Users can update their own prepare_list_items" 
    ON public.prepare_list_items FOR UPDATE 
    USING (auth.uid() IN (
        SELECT user_id FROM public.prepare_lists WHERE id = list_id
    ));

CREATE POLICY "Users can delete their own prepare_list_items" 
    ON public.prepare_list_items FOR DELETE 
    USING (auth.uid() IN (
        SELECT user_id FROM public.prepare_lists WHERE id = list_id
    )); 