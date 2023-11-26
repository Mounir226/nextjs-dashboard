'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
//Debouncing : only run the code after a specific time once the user has stopped typing -> prevent db query on every keystrock
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    console.log('term : ', term);
    console.log('searchParams:', searchParams);

    const params = new URLSearchParams(searchParams);
    console.log('params QS:', params);

    // reset page in case of pagination on prev search to 1 on new search
    params.set('page', '1');

    // set the params string If the input is empty
    term ? params.set('query', term) : params.delete('query');

    //go to the created url with new params and debounce on 300ms
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        //To ensure the input field is in sync with the URL and will be populated when sharing
        //using default value instead of value since because the state here is managed by the input
        // and not React. It's ok since you're saving the search query to the URL instead of state
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
